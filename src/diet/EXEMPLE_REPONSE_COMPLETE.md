# Exemple de Réponse Complète - Plan de Repas avec PDF

## 📤 Requête

**Endpoint** : `POST /api/diet/meal-plan`

**Body** :
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

---

## 📥 Réponse Complète

```json
{
  "breakfast": [
    "Scrambled eggs (2 whole eggs)",
    "Greek yogurt (150g)",
    "Oatmeal (60g dry)",
    "Whole grain toast (1 slice)",
    "Almonds (20g)",
    "Water"
  ],
  "snack1": [
    "Greek yogurt (100g)",
    "Banana",
    "Apple",
    "Almonds (15g)"
  ],
  "lunch": [
    "Grilled chicken breast (150g)",
    "Brown rice (120g cooked)",
    "Sweet potato (150g)",
    "Steamed broccoli",
    "Mixed green salad",
    "Olive oil dressing (1 tbsp)",
    "Water"
  ],
  "snack2": [
    "Greek yogurt (100g)",
    "Banana",
    "Apple",
    "Almonds (15g)"
  ],
  "dinner": [
    "Salmon fillet (150g)",
    "Whole wheat pasta (100g cooked)",
    "Steamed vegetables (mixed)",
    "Green beans",
    "Avocado (half)",
    "Water"
  ],
  "pdfLink": "http://localhost:3002/api/diet/meal-plan/pdf/meal-plan-67890abcdef1234567890123.pdf",
  "pdfFilename": "meal-plan-67890abcdef1234567890123.pdf"
}
```

---

## 🔗 Utilisation du Lien PDF

### Option 1 : Téléchargement Direct

**URL** : `http://localhost:3002/api/diet/meal-plan/pdf/meal-plan-67890abcdef1234567890123.pdf`

1. Copiez le `pdfLink` de la réponse
2. Collez-le dans votre navigateur
3. Le PDF se télécharge automatiquement

### Option 2 : Via l'API GET

**Endpoint** : `GET /api/diet/meal-plan/pdf/{filename}`

**Exemple** :
```
GET http://localhost:3002/api/diet/meal-plan/pdf/meal-plan-67890abcdef1234567890123.pdf
```

**Réponse** : Fichier PDF binaire (Content-Type: application/pdf)

### Option 3 : Code JavaScript/TypeScript

```typescript
// Après avoir reçu la réponse
const response = await fetch('http://localhost:3002/api/diet/meal-plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targetCalories: 2837,
    protein: 160,
    carbs: 353,
    fats: 88,
    hydration: 3.67,
    goal: 'performance',
  }),
});

const data = await response.json();

// Récupérer le lien
const pdfLink = data.pdfLink; // "http://localhost:3002/api/diet/meal-plan/pdf/..."
const pdfFilename = data.pdfFilename; // "meal-plan-67890abcdef1234567890123.pdf"

// Télécharger le PDF
if (pdfLink) {
  // Option A: Ouvrir dans le navigateur
  window.open(pdfLink, '_blank');

  // Option B: Télécharger directement
  const pdfResponse = await fetch(pdfLink);
  const blob = await pdfResponse.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = pdfFilename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
```

### Option 4 : Code React Native

```typescript
import { Linking } from 'react-native';

// Après avoir reçu la réponse
const data = await response.json();

if (data.pdfLink) {
  // Ouvrir le lien (ouvrira le navigateur ou l'app de téléchargement)
  await Linking.openURL(data.pdfLink);
}
```

### Option 5 : Code Flutter/Dart

```dart
import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';
import 'dart:io';

// Après avoir reçu la réponse
final response = await http.post(
  Uri.parse('http://localhost:3002/api/diet/meal-plan'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({
    'targetCalories': 2837,
    'protein': 160,
    'carbs': 353,
    'fats': 88,
    'hydration': 3.67,
    'goal': 'performance',
  }),
);

final data = jsonDecode(response.body);
final pdfLink = data['pdfLink'];
final pdfFilename = data['pdfFilename'];

if (pdfLink != null) {
  // Télécharger le PDF
  final pdfResponse = await http.get(Uri.parse(pdfLink));
  final directory = await getApplicationDocumentsDirectory();
  final file = File('${directory.path}/$pdfFilename');
  await file.writeAsBytes(pdfResponse.bodyBytes);
  
  // Ouvrir le fichier
  // Utiliser un package comme 'open_file' ou 'path_provider'
}
```

---

## 📄 Contenu du PDF

Le PDF généré contient :

### Page 1

**En-tête** :
- Titre : "Plan de Repas Quotidien" (violet, taille 24, centré)

**Recommandations Nutritionnelles** :
- Calories cibles: **2837 kcal/jour** (rouge)
- Protéines: **160 g** (vert)
- Glucides: **353 g** (vert)
- Lipides: **88 g** (vert)
- Hydratation: **3.67 L** (vert)

**Calories estimées** : 2837 kcal (en haut à droite)

**Plan de Repas** :

**Petit-déjeuner** (violet, souligné)
- Scrambled eggs (2 whole eggs)
- Greek yogurt (150g)
- Oatmeal (60g dry)
- Whole grain toast (1 slice)
- Almonds (20g)
- Water

**Collation Matin** (violet, souligné)
- Greek yogurt (100g)
- Banana
- Apple
- Almonds (15g)

**Déjeuner** (violet, souligné)
- Grilled chicken breast (150g)
- Brown rice (120g cooked)
- Sweet potato (150g)
- Steamed broccoli
- Mixed green salad
- Olive oil dressing (1 tbsp)
- Water

**Collation Après-midi** (violet, souligné)
- Greek yogurt (100g)
- Banana
- Apple
- Almonds (15g)

**Dîner** (violet, souligné)
- Salmon fillet (150g)
- Whole wheat pasta (100g cooked)
- Steamed vegetables (mixed)
- Green beans
- Avocado (half)
- Water

**Pied de page** :
- "Généré le [date] - PeakPlay2" (gris, centré, taille 10)

---

## 🎨 Formatage du PDF

- **Couleurs** :
  - Violet (#6B46C1) : Titres et sections
  - Rouge (#DC2626) : Calories cibles
  - Vert (#16A34A) : Protéines, glucides, lipides, hydratation
  - Noir : Texte normal
  - Gris (#666666) : Pied de page

- **Tailles de police** :
  - 24pt : Titre principal
  - 16pt : Titres de sections
  - 14pt : Calories estimées
  - 12pt : Contenu normal
  - 10pt : Pied de page

- **Marges** : 50pt sur tous les côtés
- **Format** : A4

---

## ✅ Vérifications

Avant d'utiliser le lien, vérifiez :

1. ✅ `pdfLink` est présent dans la réponse
2. ✅ `pdfFilename` est présent dans la réponse
3. ✅ Le lien commence par `http://` ou `https://`
4. ✅ Le lien contient `/api/diet/meal-plan/pdf/`
5. ✅ Le nom de fichier se termine par `.pdf`

Si toutes ces conditions sont remplies, le lien est valide et prêt à être utilisé !

