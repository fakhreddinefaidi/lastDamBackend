# ✅ Correction de l'Erreur Layout Injury

## ❌ Erreur

```
Error inflating class <unknown>
Binary XML file line #51 in tn.esprit.dam:layout/activity_injury_home
```

**Ligne 51** : `android:focusable="true">` dans `MaterialCardView`

---

## ✅ Solution Rapide

### Option 1 : Nettoyer et Reconstruire (RECOMMANDÉ)

Le problème est souvent dû à un cache Gradle corrompu.

1. **Nettoyer le projet** :
   ```bash
   cd d:\AndroidDam-main
   .\gradlew clean
   ```

2. **Invalider les caches dans Android Studio** :
   - File → Invalidate Caches / Restart
   - Sélectionner "Invalidate and Restart"

3. **Reconstruire** :
   ```bash
   .\gradlew build
   ```

4. **Synchroniser Gradle** :
   - File → Sync Project with Gradle Files

---

### Option 2 : Vérifier la Dépendance Material Design

La dépendance est déjà présente dans `build.gradle.kts` (ligne 88) :
```kotlin
implementation("com.google.android.material:material:1.13.0")
```

**Vérifier** :
1. Que Gradle est bien synchronisé
2. Que la dépendance est bien téléchargée
3. Dans Android Studio : File → Project Structure → Dependencies

---

### Option 3 : Corriger le Layout XML

Si le problème persiste, modifier `activity_injury_home.xml` :

**Ligne 51** - Remplacer :
```xml
android:focusable="true">
```

**Par** :
```xml
android:focusable="true"
android:foreground="?attr/selectableItemBackground">
```

**Ou simplifier** en retirant `focusable` :
```xml
android:clickable="true">
```

---

### Option 4 : Utiliser CardView Standard (Alternative)

Si MaterialCardView pose toujours problème, remplacer par CardView standard :

**Dans `activity_injury_home.xml`** :

**Remplacer** (lignes 43-51) :
```xml
<com.google.android.material.card.MaterialCardView
    android:id="@+id/cardPlayer"
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:layout_marginBottom="16dp"
    app:cardElevation="4dp"
    app:cardCornerRadius="12dp"
    android:clickable="true"
    android:focusable="true">
```

**Par** :
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

**Et ajouter la dépendance** dans `build.gradle.kts` :
```kotlin
implementation("androidx.cardview:cardview:1.0.0")
```

**Répéter** pour les 3 cards (cardPlayer, cardAcademy, cardReferee).

---

## 🔍 Vérification Backend

Le backend est correctement configuré :

- ✅ **Port** : `3001`
- ✅ **Préfixe API** : `/api/v1`
- ✅ **Endpoints Injury** : Tous disponibles
  - `POST /api/v1/injury` - Déclarer blessure
  - `GET /api/v1/injury/my` - Mes blessures
  - `POST /api/v1/injury/{id}/evolution` - Évolution
  - `GET /api/v1/injury/academy/{id}` - Blessures académie
  - `PATCH /api/v1/injury/{id}/status` - Statut
  - `PATCH /api/v1/injury/{id}/recommendations` - Recommandations

---

## 🧪 Test Après Correction

1. **Nettoyer** :
   ```bash
   .\gradlew clean
   ```

2. **Reconstruire** :
   ```bash
   .\gradlew build
   ```

3. **Lancer l'app** et tester :
   - Ouvrir l'écran "Gestion des Blessures"
   - Vérifier que les 3 cards s'affichent (Joueur, Académie, Arbitre)
   - Plus d'erreur "Error inflating class"

---

## 📝 Ordre de Correction Recommandé

1. ✅ **Essayer d'abord** : Nettoyer et reconstruire (Option 1)
2. ✅ **Si ça ne marche pas** : Vérifier la dépendance (Option 2)
3. ✅ **Si ça ne marche toujours pas** : Modifier le layout (Option 3)
4. ✅ **Dernier recours** : Utiliser CardView standard (Option 4)

---

## 🎯 Résumé

**Problème** : Erreur d'inflation du layout à la ligne 51  
**Cause probable** : Cache Gradle corrompu ou problème de synchronisation  
**Solution rapide** : Nettoyer le projet et reconstruire

---

*Guide créé le: $(date)*

