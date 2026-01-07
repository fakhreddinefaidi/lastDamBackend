# Installation des Dépendances pour le Module Diet

## Dépendances Requises

Pour utiliser la génération de PDF, vous devez installer les packages suivants :

```bash
npm install pdfkit uuid
npm install --save-dev @types/uuid
```

## Installation Complète

```bash
# Installer PDFKit pour la génération de PDF
npm install pdfkit

# Installer UUID pour générer des noms de fichiers uniques
npm install uuid
npm install --save-dev @types/uuid
```

## Vérification

Après installation, redémarrez le serveur. Le module détectera automatiquement si PDFKit est installé et activera la génération de PDF.

Si PDFKit n'est pas installé, le module fonctionnera toujours mais sans génération de PDF (un avertissement sera loggé).

## Structure des Fichiers

Les PDFs générés seront stockés dans :
```
uploads/pdfs/
```

Ce dossier est créé automatiquement au démarrage du module.

