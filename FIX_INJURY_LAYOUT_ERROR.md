# 🔧 Correction de l'Erreur Layout Injury - activity_injury_home.xml

## ❌ Erreur Détectée

```
Error inflating class <unknown>
Binary XML file line #51 in tn.esprit.dam:layout/activity_injury_home
```

**Ligne 51** : `android:focusable="true">` dans `MaterialCardView`

---

## 🔍 Cause Probable

L'erreur "Error inflating class <unknown>" indique généralement :
1. **Dépendance Material Design manquante** dans `build.gradle.kts`
2. **Classe MaterialCardView non trouvée**
3. **Version incompatible** de Material Components

---

## ✅ Solution

### 1. Vérifier les Dépendances Material Design

**Fichier** : `app/build.gradle.kts`

Assurez-vous d'avoir ces dépendances :

```kotlin
dependencies {
    // Material Design Components (OBLIGATOIRE)
    implementation("com.google.android.material:material:1.11.0")
    
    // AndroidX Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    
    // CoordinatorLayout
    implementation("androidx.coordinatorlayout:coordinatorlayout:1.2.0")
    
    // ... autres dépendances
}
```

### 2. Vérifier le Namespace dans le Layout

**Fichier** : `app/src/main/res/layout/activity_injury_home.xml`

Le fichier doit avoir ces namespaces en haut :

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.coordinatorlayout.widget.CoordinatorLayout 
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    ...>
```

### 3. Alternative : Remplacer MaterialCardView par CardView

Si Material Design n'est pas disponible, remplacez :

**Avant** :
```xml
<com.google.android.material.card.MaterialCardView
    android:id="@+id/cardPlayer"
    ...>
```

**Après** :
```xml
<androidx.cardview.widget.CardView
    android:id="@+id/cardPlayer"
    xmlns:card_view="http://schemas.android.com/apk/res-auto"
    card_view:cardElevation="4dp"
    card_view:cardCornerRadius="12dp"
    ...>
```

Et ajoutez la dépendance :
```kotlin
implementation("androidx.cardview:cardview:1.0.0")
```

---

## 🔧 Correction Recommandée (Option 1 - Material Design)

### Étape 1 : Ajouter la Dépendance

Dans `app/build.gradle.kts` :

```kotlin
dependencies {
    // Material Design Components
    implementation("com.google.android.material:material:1.11.0")
    
    // ... autres dépendances existantes
}
```

### Étape 2 : Synchroniser Gradle

Dans Android Studio :
- Cliquez sur **File → Sync Project with Gradle Files**
- Ou utilisez le bouton **Sync Now** qui apparaît

### Étape 3 : Nettoyer et Reconstruire

```bash
./gradlew clean
./gradlew build
```

---

## 🔧 Correction Alternative (Option 2 - CardView Standard)

Si Material Design pose problème, utilisez CardView standard :

### Modifier `activity_injury_home.xml`

**Remplacer toutes les occurrences de** :
```xml
<com.google.android.material.card.MaterialCardView
```

**Par** :
```xml
<androidx.cardview.widget.CardView
```

**Et ajouter** :
```xml
xmlns:card_view="http://schemas.android.com/apk/res-auto"
```

**Exemple complet** :
```xml
<androidx.cardview.widget.CardView
    xmlns:card_view="http://schemas.android.com/apk/res-auto"
    android:id="@+id/cardPlayer"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_marginBottom="16dp"
    card_view:cardElevation="4dp"
    card_view:cardCornerRadius="12dp"
    android:clickable="true"
    android:focusable="true">
```

**Ajouter la dépendance** dans `build.gradle.kts` :
```kotlin
implementation("androidx.cardview:cardview:1.0.0")
```

---

## ✅ Vérification Backend

Le backend est correctement configuré pour les endpoints Injury :

- ✅ `POST /api/v1/injury` - Déclarer une blessure
- ✅ `GET /api/v1/injury/my` - Mes blessures
- ✅ `POST /api/v1/injury/{id}/evolution` - Ajouter évolution
- ✅ `GET /api/v1/injury/academy/{id}` - Blessures académie
- ✅ `PATCH /api/v1/injury/{id}/status` - Mettre à jour statut
- ✅ `PATCH /api/v1/injury/{id}/recommendations` - Ajouter recommandations

**Port Backend** : `3001` ✅  
**Préfixe API** : `/api/v1` ✅

---

## 🧪 Test Après Correction

1. **Nettoyer le projet** :
   ```bash
   ./gradlew clean
   ```

2. **Reconstruire** :
   ```bash
   ./gradlew build
   ```

3. **Lancer l'app** et tester l'écran Injury

4. **Vérifier les logs** :
   - Plus d'erreur "Error inflating class"
   - L'écran Injury s'affiche correctement

---

## 📝 Notes Importantes

- **Material Design** est recommandé pour une meilleure apparence
- **CardView standard** fonctionne aussi mais avec moins de fonctionnalités
- Assurez-vous que toutes les dépendances sont synchronisées
- Vérifiez que le backend est démarré sur le port **3001**

---

## 🎯 Résumé

**Problème** : Erreur d'inflation du layout `activity_injury_home.xml` ligne 51  
**Cause** : Dépendance Material Design manquante ou incompatible  
**Solution** : Ajouter `com.google.android.material:material:1.11.0` dans `build.gradle.kts`

---

*Guide créé le: $(date)*

