# Guide de Test - Génération PDF du Plan de Repas

## 📋 Vue d'ensemble

Ce guide explique comment tester la génération de PDF et l'utilisation du lien de téléchargement pour les plans de repas.

---

## 🔧 Prérequis

### 1. Installation des dépendances

```bash
cd D:\peakplay2
npm install pdfkit uuid
npm install --save-dev @types/uuid
```

### 2. Vérification de l'installation

Redémarrez le serveur après l'installation :

```bash
npm run start:dev
```

Le serveur devrait démarrer sur `http://localhost:3002` (ou le port configuré).

---

## 🧪 Test Étape par Étape

### Étape 1 : Accéder à Swagger

1. Ouvrez votre navigateur
2. Accédez à : `http://localhost:3002/api/docs`
3. Naviguez vers la section **"Diet & Nutrition"**

### Étape 2 : Générer un Plan de Repas

1. **Trouvez l'endpoint** : `POST /api/diet/meal-plan`
2. **Cliquez sur "Try it out"**
3. **Remplissez le body** avec cet exemple :

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

4. **Cliquez sur "Execute"**

### Étape 3 : Vérifier la Réponse

La réponse devrait contenir :

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
  "pdfLink": "http://localhost:3002/api/diet/meal-plan/pdf/meal-plan-abc123.pdf",
  "pdfFilename": "meal-plan-abc123.pdf"
}
```

**✅ Points à vérifier :**
- `pdfLink` est présent dans la réponse
- `pdfFilename` est présent dans la réponse
- Le lien commence par `http://localhost:3002/api/diet/meal-plan/pdf/`

### Étape 4 : Télécharger le PDF

#### Option A : Via le lien direct

1. **Copiez le `pdfLink`** de la réponse
2. **Collez-le dans votre navigateur**
3. Le PDF devrait se télécharger automatiquement

#### Option B : Via Swagger

1. **Trouvez l'endpoint** : `GET /api/diet/meal-plan/pdf/{filename}`
2. **Cliquez sur "Try it out"**
3. **Remplissez le paramètre** `filename` avec la valeur de `pdfFilename` de l'étape précédente
   - Exemple : `meal-plan-abc123.pdf`
4. **Cliquez sur "Execute"**
5. Le PDF devrait être téléchargé

#### Option C : Via cURL

```bash
curl -X GET "http://localhost:3002/api/diet/meal-plan/pdf/meal-plan-abc123.pdf" \
  -H "accept: application/pdf" \
  --output meal-plan.pdf
```

Remplacez `meal-plan-abc123.pdf` par le `pdfFilename` réel de votre réponse.

---

## 📱 Test depuis l'Application Mobile

### Exemple de code (React Native / Flutter)

```javascript
// Après avoir appelé POST /api/diet/meal-plan
const response = await fetch('http://localhost:3002/api/diet/meal-plan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
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

// Récupérer le lien PDF
const pdfLink = data.pdfLink;
const pdfFilename = data.pdfFilename;

// Télécharger le PDF
if (pdfLink) {
  // Option 1: Ouvrir dans le navigateur
  Linking.openURL(pdfLink);

  // Option 2: Télécharger directement
  const pdfResponse = await fetch(pdfLink);
  const blob = await pdfResponse.blob();
  // Sauvegarder le blob comme fichier PDF
}
```

---

## 🔍 Vérification du Contenu du PDF

Le PDF généré devrait contenir :

1. **En-tête** :
   - Titre : "Plan de Repas Quotidien" (en violet)
   - Date de génération

2. **Recommandations Nutritionnelles** :
   - Calories cibles (en rouge)
   - Protéines (en vert)
   - Glucides (en vert)
   - Lipides (en vert)
   - Hydratation (en vert)

3. **Calories estimées** :
   - Valeur totale en haut à droite

4. **Plan de Repas Complet** :
   - **Petit-déjeuner** : Liste des aliments
   - **Collation Matin** : Liste des aliments
   - **Déjeuner** : Liste des aliments
   - **Collation Après-midi** : Liste des aliments
   - **Dîner** : Liste des aliments

5. **Pied de page** :
   - Date de génération
   - "PeakPlay2"

---

## 🐛 Dépannage

### Problème : `pdfLink` est `undefined` dans la réponse

**Cause** : PDFKit n'est pas installé ou n'a pas pu être chargé.

**Solution** :
```bash
npm install pdfkit uuid
npm install --save-dev @types/uuid
```

Puis redémarrez le serveur.

### Problème : Erreur 404 lors du téléchargement

**Causes possibles** :
1. Le fichier PDF n'a pas été généré
2. Le nom du fichier est incorrect
3. Le serveur a été redémarré (les fichiers sont supprimés)

**Solution** : Régénérez le plan de repas pour créer un nouveau PDF.

### Problème : Le PDF est vide ou corrompu

**Cause** : Erreur lors de la génération du PDF.

**Solution** : Vérifiez les logs du serveur pour voir l'erreur exacte.

### Problème : Le lien utilise le mauvais port

**Cause** : Le `baseUrl` n'est pas correctement détecté.

**Solution** : Le contrôleur détecte automatiquement le port depuis la requête. Si vous utilisez un proxy ou un reverse proxy, configurez `API_BASE_URL` dans votre `.env` :

```env
API_BASE_URL=http://votre-domaine.com
```

---

## 📊 Exemples de Tests Complets

### Test 1 : Plan de Repas Standard

```bash
# 1. Générer le plan
curl -X POST "http://localhost:3002/api/diet/meal-plan" \
  -H "Content-Type: application/json" \
  -d '{
    "targetCalories": 2500,
    "protein": 150,
    "carbs": 300,
    "fats": 80,
    "hydration": 3.5,
    "goal": "performance"
  }'

# Réponse contient pdfLink et pdfFilename

# 2. Télécharger le PDF (remplacez le filename)
curl -X GET "http://localhost:3002/api/diet/meal-plan/pdf/meal-plan-XXXXX.pdf" \
  --output meal-plan.pdf
```

### Test 2 : Plan de Repas pour Perte de Poids

```bash
curl -X POST "http://localhost:3002/api/diet/meal-plan" \
  -H "Content-Type: application/json" \
  -d '{
    "targetCalories": 2000,
    "protein": 140,
    "carbs": 200,
    "fats": 70,
    "hydration": 3.0,
    "goal": "weight_loss"
  }'
```

### Test 3 : Plan de Repas pour Prise de Masse

```bash
curl -X POST "http://localhost:3002/api/diet/meal-plan" \
  -H "Content-Type: application/json" \
  -d '{
    "targetCalories": 3200,
    "protein": 180,
    "carbs": 400,
    "fats": 100,
    "hydration": 4.0,
    "goal": "muscle_gain"
  }'
```

---

## 📁 Emplacement des Fichiers PDF

Les PDFs générés sont stockés dans :

```
D:\peakplay2\uploads\pdfs\
```

Ce dossier est créé automatiquement au premier appel.

**Note** : Les fichiers PDF ne sont pas supprimés automatiquement. Vous pouvez les nettoyer manuellement si nécessaire.

---

## ✅ Checklist de Test

- [ ] PDFKit et UUID sont installés
- [ ] Le serveur redémarre sans erreur
- [ ] `POST /api/diet/meal-plan` retourne `pdfLink` et `pdfFilename`
- [ ] Le lien PDF est accessible
- [ ] Le PDF se télécharge correctement
- [ ] Le contenu du PDF est correct (titre, recommandations, plan de repas)
- [ ] Le formatage du PDF est correct (couleurs, structure)
- [ ] Le PDF s'ouvre correctement dans un lecteur PDF

---

## 🎯 Résultat Attendu

Après avoir suivi ce guide, vous devriez :

1. ✅ Pouvoir générer un plan de repas avec un lien PDF
2. ✅ Télécharger le PDF via le lien fourni
3. ✅ Voir un PDF bien formaté avec toutes les informations
4. ✅ Intégrer cette fonctionnalité dans votre application mobile

---

**Besoin d'aide ?** Consultez les logs du serveur pour plus de détails sur les erreurs éventuelles.

