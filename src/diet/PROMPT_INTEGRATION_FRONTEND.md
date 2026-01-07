# 📱 PROMPT - Intégration Module Diet dans le Frontend Android

## 🎯 Objectif

Intégrer le module Diet & Nutrition dans l'application mobile Android pour permettre aux joueurs de :
1. Obtenir des recommandations nutritionnelles personnalisées (calories, protéines, glucides, lipides, hydratation)
2. Générer un plan de repas quotidien basé sur leurs besoins
3. Télécharger et visualiser le plan de repas en PDF

---

## 📋 Endpoints API Disponibles

### 1. POST /api/diet/predict
**Prédiction des besoins nutritionnels**

**Request Body:**
```json
{
  "age": 25,
  "height": 180,
  "weight": 75,
  "position": "midfielder",
  "goal": "performance",
  "trainingIntensity": 7,
  "matchesPerWeek": 2,
  "injuryRisk": "low",
  "bodyfatPercent": 15
}
```

**Response:**
```json
{
  "targetCalories": 2837,
  "protein": 160,
  "carbs": 353,
  "fats": 88,
  "hydration": 3.67
}
```

### 2. POST /api/diet/meal-plan
**Génération du plan de repas**

**Request Body:**
```json
{
  "targetCalories": 2837,
  "protein": 160,
  "carbs": 353,
  "fats": 88,
  "hydration": 3.67,
  "goal": "performance"
}
```

**Response:**
```json
{
  "breakfast": ["Scrambled eggs (2 whole eggs)", "Greek yogurt (150g)", ...],
  "snack1": ["Greek yogurt (100g)", "Banana", ...],
  "lunch": ["Grilled chicken breast (150g)", "Brown rice (120g cooked)", ...],
  "snack2": ["Greek yogurt (100g)", "Banana", ...],
  "dinner": ["Salmon fillet (150g)", "Whole wheat pasta (100g cooked)", ...],
  "pdfLink": "http://localhost:3002/api/diet/meal-plan/pdf/meal-plan-abc123.pdf",
  "pdfFilename": "meal-plan-abc123.pdf"
}
```

### 3. GET /api/diet/meal-plan/pdf/{filename}
**Téléchargement du PDF**

**Response:** Fichier PDF binaire

---

## 🏗️ Architecture Frontend Recommandée

### Structure des Écrans

```
DietModule/
├── PredictNutritionScreen.kt      # Écran de saisie des données joueur
├── NutritionRecommendationsScreen.kt  # Affichage des recommandations
├── MealPlanScreen.kt              # Affichage du plan de repas
├── ViewPdfScreen.kt               # Visualisation du PDF
├── ViewModels/
│   ├── DietViewModel.kt           # Logique métier
│   └── NutritionData.kt           # Modèles de données
└── Services/
    └── DietApiService.kt          # Appels API
```

---

## 💻 Implémentation Android (Kotlin)

### 1. Modèles de Données

```kotlin
// NutritionData.kt
data class PredictNutritionRequest(
    val age: Int,
    val height: Int,
    val weight: Int,
    val position: String, // "goalkeeper", "defender", "midfielder", "forward"
    val goal: String, // "weight_loss", "muscle_gain", "maintenance", "performance"
    val trainingIntensity: Int, // 1-10
    val matchesPerWeek: Int, // 0-7
    val injuryRisk: String, // "low", "medium", "high"
    val bodyfatPercent: Double // 5-40
)

data class NutritionPrediction(
    val targetCalories: Int,
    val protein: Int,
    val carbs: Int,
    val fats: Int,
    val hydration: Double
)

data class MealPlanRequest(
    val targetCalories: Int,
    val protein: Int,
    val carbs: Int,
    val fats: Int,
    val hydration: Double,
    val goal: String
)

data class MealPlanResponse(
    val breakfast: List<String>,
    val snack1: List<String>,
    val snack2: List<String>,
    val lunch: List<String>,
    val dinner: List<String>,
    val pdfLink: String?,
    val pdfFilename: String?
)
```

### 2. Service API (Retrofit)

```kotlin
// DietApiService.kt
import retrofit2.http.*
import retrofit2.Call

interface DietApiService {
    @POST("diet/predict")
    fun predictNutrition(
        @Body request: PredictNutritionRequest
    ): Call<NutritionPrediction>

    @POST("diet/meal-plan")
    fun generateMealPlan(
        @Body request: MealPlanRequest
    ): Call<MealPlanResponse>

    @GET("diet/meal-plan/pdf/{filename}")
    @Streaming
    fun downloadPdf(
        @Path("filename") filename: String
    ): Call<ResponseBody>
}
```

### 3. ViewModel

```kotlin
// DietViewModel.kt
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class DietViewModel(
    private val apiService: DietApiService
) : ViewModel() {

    // État pour les recommandations nutritionnelles
    private val _nutritionPrediction = MutableStateFlow<NutritionPrediction?>(null)
    val nutritionPrediction: StateFlow<NutritionPrediction?> = _nutritionPrediction

    // État pour le plan de repas
    private val _mealPlan = MutableStateFlow<MealPlanResponse?>(null)
    val mealPlan: StateFlow<MealPlanResponse?> = _mealPlan

    // État de chargement
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    // État d'erreur
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    /**
     * Prédire les besoins nutritionnels
     */
    fun predictNutrition(request: PredictNutritionRequest) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            try {
                val response = apiService.predictNutrition(request).execute()
                if (response.isSuccessful) {
                    _nutritionPrediction.value = response.body()
                } else {
                    _error.value = "Erreur: ${response.message()}"
                }
            } catch (e: Exception) {
                _error.value = "Erreur de connexion: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Générer le plan de repas
     */
    fun generateMealPlan(request: MealPlanRequest) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            try {
                val response = apiService.generateMealPlan(request).execute()
                if (response.isSuccessful) {
                    _mealPlan.value = response.body()
                } else {
                    _error.value = "Erreur: ${response.message()}"
                }
            } catch (e: Exception) {
                _error.value = "Erreur de connexion: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Télécharger le PDF
     */
    suspend fun downloadPdf(
        filename: String,
        context: Context
    ): File? {
        return try {
            val response = apiService.downloadPdf(filename).execute()
            if (response.isSuccessful) {
                val body = response.body()
                if (body != null) {
                    val file = File(context.getExternalFilesDir(null), filename)
                    body.byteStream().use { input ->
                        file.outputStream().use { output ->
                            input.copyTo(output)
                        }
                    }
                    file
                } else null
            } else null
        } catch (e: Exception) {
            null
        }
    }
}
```

### 4. Écran de Prédiction Nutritionnelle

```kotlin
// PredictNutritionScreen.kt
@Composable
fun PredictNutritionScreen(
    viewModel: DietViewModel,
    onNavigateToRecommendations: (NutritionPrediction) -> Unit
) {
    var age by remember { mutableStateOf("") }
    var height by remember { mutableStateOf("") }
    var weight by remember { mutableStateOf("") }
    var position by remember { mutableStateOf("midfielder") }
    var goal by remember { mutableStateOf("performance") }
    var trainingIntensity by remember { mutableStateOf(5f) }
    var matchesPerWeek by remember { mutableStateOf(2) }
    var injuryRisk by remember { mutableStateOf("low") }
    var bodyfatPercent by remember { mutableStateOf("") }

    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Recommandations Nutritionnelles",
            style = MaterialTheme.typography.h4,
            fontWeight = FontWeight.Bold
        )

        // Champs de saisie
        OutlinedTextField(
            value = age,
            onValueChange = { age = it },
            label = { Text("Âge") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
        )

        OutlinedTextField(
            value = height,
            onValueChange = { height = it },
            label = { Text("Taille (cm)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
        )

        OutlinedTextField(
            value = weight,
            onValueChange = { weight = it },
            label = { Text("Poids (kg)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
        )

        // Position dropdown
        var expandedPosition by remember { mutableStateOf(false) }
        ExposedDropdownMenuBox(
            expanded = expandedPosition,
            onExpandedChange = { expandedPosition = !expandedPosition }
        ) {
            OutlinedTextField(
                value = position,
                onValueChange = {},
                readOnly = true,
                label = { Text("Position") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedPosition) },
                modifier = Modifier.menuAnchor()
            )
            ExposedDropdownMenu(
                expanded = expandedPosition,
                onDismissRequest = { expandedPosition = false }
            ) {
                listOf("goalkeeper", "defender", "midfielder", "forward").forEach { pos ->
                    DropdownMenuItem(
                        text = { Text(pos.capitalize()) },
                        onClick = {
                            position = pos
                            expandedPosition = false
                        }
                    )
                }
            }
        }

        // Goal dropdown
        var expandedGoal by remember { mutableStateOf(false) }
        ExposedDropdownMenuBox(
            expanded = expandedGoal,
            onExpandedChange = { expandedGoal = !expandedGoal }
        ) {
            OutlinedTextField(
                value = goal,
                onValueChange = {},
                readOnly = true,
                label = { Text("Objectif") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedGoal) },
                modifier = Modifier.menuAnchor()
            )
            ExposedDropdownMenu(
                expanded = expandedGoal,
                onDismissRequest = { expandedGoal = false }
            ) {
                listOf("weight_loss", "muscle_gain", "maintenance", "performance").forEach { g ->
                    DropdownMenuItem(
                        text = { Text(g.replace("_", " ").capitalize()) },
                        onClick = {
                            goal = g
                            expandedGoal = false
                        }
                    )
                }
            }
        }

        // Training Intensity Slider
        Text("Intensité d'entraînement: ${trainingIntensity.toInt()}")
        Slider(
            value = trainingIntensity,
            onValueChange = { trainingIntensity = it },
            valueRange = 1f..10f,
            steps = 8
        )

        // Matches per week
        Text("Matchs par semaine: $matchesPerWeek")
        Slider(
            value = matchesPerWeek.toFloat(),
            onValueChange = { matchesPerWeek = it.toInt() },
            valueRange = 0f..7f,
            steps = 6
        )

        // Injury Risk
        var expandedRisk by remember { mutableStateOf(false) }
        ExposedDropdownMenuBox(
            expanded = expandedRisk,
            onExpandedChange = { expandedRisk = !expandedRisk }
        ) {
            OutlinedTextField(
                value = injuryRisk,
                onValueChange = {},
                readOnly = true,
                label = { Text("Risque de blessure") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedRisk) },
                modifier = Modifier.menuAnchor()
            )
            ExposedDropdownMenu(
                expanded = expandedRisk,
                onDismissRequest = { expandedRisk = false }
            ) {
                listOf("low", "medium", "high").forEach { risk ->
                    DropdownMenuItem(
                        text = { Text(risk.capitalize()) },
                        onClick = {
                            injuryRisk = risk
                            expandedRisk = false
                        }
                    )
                }
            }
        }

        OutlinedTextField(
            value = bodyfatPercent,
            onValueChange = { bodyfatPercent = it },
            label = { Text("Pourcentage de graisse corporelle (%)") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal)
        )

        // Bouton de prédiction
        Button(
            onClick = {
                viewModel.predictNutrition(
                    PredictNutritionRequest(
                        age = age.toIntOrNull() ?: 0,
                        height = height.toIntOrNull() ?: 0,
                        weight = weight.toIntOrNull() ?: 0,
                        position = position,
                        goal = goal,
                        trainingIntensity = trainingIntensity.toInt(),
                        matchesPerWeek = matchesPerWeek,
                        injuryRisk = injuryRisk,
                        bodyfatPercent = bodyfatPercent.toDoubleOrNull() ?: 0.0
                    )
                )
            },
            enabled = !isLoading && age.isNotBlank() && height.isNotBlank() && 
                     weight.isNotBlank() && bodyfatPercent.isNotBlank(),
            modifier = Modifier.fillMaxWidth()
        ) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.size(20.dp))
            } else {
                Text("Obtenir les recommandations")
            }
        }

        // Afficher l'erreur
        error?.let {
            Text(
                text = it,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(8.dp)
            )
        }

        // Navigation vers les recommandations
        LaunchedEffect(viewModel.nutritionPrediction.value) {
            viewModel.nutritionPrediction.value?.let {
                onNavigateToRecommendations(it)
            }
        }
    }
}
```

### 5. Écran des Recommandations Nutritionnelles

```kotlin
// NutritionRecommendationsScreen.kt
@Composable
fun NutritionRecommendationsScreen(
    nutrition: NutritionPrediction,
    viewModel: DietViewModel,
    onNavigateToMealPlan: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Recommandations Nutritionnelles",
            style = MaterialTheme.typography.h4,
            fontWeight = FontWeight.Bold
        )

        // Card pour les calories
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = Color(0xFFF3F4F6)
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = Color(0xFFDC2626),
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Calories cibles",
                            style = MaterialTheme.typography.bodyLarge,
                            color = Color(0xFF4B5563)
                        )
                    }
                    Text(
                        text = "${nutrition.targetCalories} kcal/jour",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFDC2626)
                    )
                }
            }
        }

        // Card pour les protéines
        NutritionCard(
            icon = Icons.Default.Info,
            label = "Protéines",
            value = "${nutrition.protein} g",
            iconColor = Color(0xFF16A34A)
        )

        // Card pour les glucides
        NutritionCard(
            icon = Icons.Default.Info,
            label = "Glucides",
            value = "${nutrition.carbs} g",
            iconColor = Color(0xFF16A34A)
        )

        // Card pour les lipides
        NutritionCard(
            icon = Icons.Default.Info,
            label = "Lipides",
            value = "${nutrition.fats} g",
            iconColor = Color(0xFF16A34A)
        )

        // Card pour l'hydratation
        NutritionCard(
            icon = Icons.Default.Info,
            label = "Hydratation",
            value = "${nutrition.hydration} L",
            iconColor = Color(0xFF16A34A)
        )

        // Bouton pour générer le plan de repas
        Button(
            onClick = {
                viewModel.generateMealPlan(
                    MealPlanRequest(
                        targetCalories = nutrition.targetCalories,
                        protein = nutrition.protein,
                        carbs = nutrition.carbs,
                        fats = nutrition.fats,
                        hydration = nutrition.hydration,
                        goal = "performance" // Récupérer depuis l'écran précédent
                    )
                )
                onNavigateToMealPlan()
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Générer le plan de repas")
        }
    }
}

@Composable
fun NutritionCard(
    icon: ImageVector,
    label: String,
    value: String,
    iconColor: Color
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFFF3F4F6)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = iconColor,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = label,
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color(0xFF4B5563)
                )
            }
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = iconColor
            )
        }
    }
}
```

### 6. Écran du Plan de Repas

```kotlin
// MealPlanScreen.kt
@Composable
fun MealPlanScreen(
    viewModel: DietViewModel,
    context: Context
) {
    val mealPlan by viewModel.mealPlan.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    if (isLoading) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator()
        }
    } else {
        mealPlan?.let { plan ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Plan de Repas Quotidien",
                    style = MaterialTheme.typography.h4,
                    fontWeight = FontWeight.Bold
                )

                // Petit-déjeuner
                MealSection(
                    title = "Petit-déjeuner",
                    items = plan.breakfast
                )

                // Collation matin
                MealSection(
                    title = "Collation Matin",
                    items = plan.snack1
                )

                // Déjeuner
                MealSection(
                    title = "Déjeuner",
                    items = plan.lunch
                )

                // Collation après-midi
                MealSection(
                    title = "Collation Après-midi",
                    items = plan.snack2
                )

                // Dîner
                MealSection(
                    title = "Dîner",
                    items = plan.dinner
                )

                // Bouton pour télécharger le PDF
                plan.pdfLink?.let { pdfLink ->
                    plan.pdfFilename?.let { filename ->
                        Button(
                            onClick = {
                                // Télécharger et ouvrir le PDF
                                viewModelScope.launch {
                                    val file = viewModel.downloadPdf(filename, context)
                                    file?.let {
                                        val intent = Intent(Intent.ACTION_VIEW).apply {
                                            setDataAndType(
                                                FileProvider.getUriForFile(
                                                    context,
                                                    "${context.packageName}.fileprovider",
                                                    it
                                                ),
                                                "application/pdf"
                                            )
                                            flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
                                        }
                                        context.startActivity(intent)
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Icon(
                                imageVector = Icons.Default.Download,
                                contentDescription = null
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Télécharger le PDF")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MealSection(
    title: String,
    items: List<String>
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFFF3F4F6)
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.h6,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF6B46C1)
            )
            Divider()
            items.forEach { item ->
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = Color(0xFF16A34A),
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = item,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    }
}
```

### 7. Configuration Retrofit

```kotlin
// ApiModule.kt ou dans votre Application class
object ApiModule {
    private const val BASE_URL = "http://votre-ip:3002/api/"

    fun provideDietApiService(): DietApiService {
        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        
        return retrofit.create(DietApiService::class.java)
    }
}
```

### 8. Configuration FileProvider (pour ouvrir les PDFs)

**AndroidManifest.xml:**
```xml
<provider
    android:name="androidx.core.content.FileProvider"
    android:authorities="${applicationId}.fileprovider"
    android:exported="false"
    android:grantUriPermissions="true">
    <meta-data
        android:name="android.support.FILE_PROVIDER_PATHS"
        android:resource="@xml/file_paths" />
</provider>
```

**res/xml/file_paths.xml:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<paths>
    <external-files-path name="pdfs" path="." />
</paths>
```

---

## 🎨 Design UI Recommandé

### Couleurs
- **Violet** (#6B46C1) : Titres et sections
- **Rouge** (#DC2626) : Calories cibles
- **Vert** (#16A34A) : Protéines, glucides, lipides, hydratation
- **Gris clair** (#F3F4F6) : Fond des cards

### Composants UI
- Cards avec bordures arrondies pour chaque section
- Icônes colorées pour chaque type de nutrition
- Liste avec checkmarks pour les repas
- Bouton de téléchargement PDF avec icône

---

## ✅ Checklist d'Intégration

- [ ] Créer les modèles de données (NutritionData.kt)
- [ ] Configurer Retrofit avec les endpoints
- [ ] Créer le ViewModel avec les appels API
- [ ] Implémenter l'écran de prédiction
- [ ] Implémenter l'écran des recommandations
- [ ] Implémenter l'écran du plan de repas
- [ ] Ajouter le téléchargement PDF
- [ ] Configurer FileProvider pour ouvrir les PDFs
- [ ] Tester tous les scénarios (succès, erreurs)
- [ ] Ajouter la gestion des erreurs et loading states
- [ ] Intégrer avec la navigation de l'app

---

## 🚀 Points Importants

1. **URL de base** : Remplacez `http://votre-ip:3002/api/` par l'URL réelle de votre backend
2. **Gestion d'erreurs** : Affichez des messages d'erreur clairs à l'utilisateur
3. **Loading states** : Montrez un indicateur de chargement pendant les appels API
4. **Validation** : Validez les entrées avant d'envoyer la requête
5. **PDF** : Le PDF est généré automatiquement, utilisez le lien fourni pour le télécharger

---

**Ce prompt fournit une base complète pour intégrer le module Diet dans votre application Android. Adaptez le code selon votre architecture existante (MVVM, Clean Architecture, etc.).**

