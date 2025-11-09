# 🚨 URGENT : Fix Render Start Command

## ❌ Le problème

Render exécute toujours `node electron-main.js` même après avoir modifié le package.json.

**Erreur dans les logs :**
```
==> Running 'node electron-main.js'
Error: Cannot find module '/opt/render/project/src/electron-main.js'
```

## 🔍 Cause

**Render utilise la commande configurée dans l'interface Settings, PAS le package.json !**

Même si le package.json a `"start": "node activation-server.js"`, Render ignore cela et utilise ce qui est dans Settings.

## ✅ SOLUTION IMMÉDIATE (À FAIRE MAINTENANT)

### Option 1 : Modifier dans Render Settings (RECOMMANDÉ - 2 minutes)

1. **Allez sur** https://dashboard.render.com
2. **Cliquez sur** votre service `iptv-activation-server`
3. **Cliquez sur** l'onglet **"Settings"** (en haut)
4. **Faites défiler** jusqu'à la section **"Build & Deploy"**
5. **Trouvez** le champ **"Start Command"**
6. **EFFACEZ** tout ce qui est écrit (probablement `node electron-main.js`)
7. **Tapez exactement** :
   ```
   node activation-server.js
   ```
8. **Cliquez sur** "Save Changes" (en bas de la page)
9. **Render va redéployer automatiquement**

### Option 2 : Utiliser npm start (Alternative)

Si l'option 1 ne fonctionne pas :

1. **Dans Render Settings**, trouvez **"Start Command"**
2. **Remplacez** par :
   ```
   npm start
   ```
3. **Sauvegardez**

Le package.json a `"start": "node activation-server.js"`, donc `npm start` devrait fonctionner.

## 📸 Où trouver "Start Command" dans Render

```
Render Dashboard
  └─> Votre service (iptv-activation-server)
      └─> Settings (onglet en haut)
          └─> Build & Deploy (section)
              └─> Start Command (champ à modifier)
```

## ✅ Vérification après modification

1. **Allez dans** l'onglet **"Logs"**
2. **Vous devriez voir** :
   ```
   ==> Running 'node activation-server.js'
   🚀 ================================
   🔐 ACTIVATION SERVER STARTED
   📡 Server running on: http://localhost:XXXX
   ```

## 🔧 Autres configurations à vérifier

Dans Render Settings > Build & Deploy :

- ✅ **Build Command** : Laissez **vide** (ou `npm install` si nécessaire)
- ✅ **Start Command** : `node activation-server.js` (OU `npm start`)
- ✅ **Environment** : `Node`
- ✅ **Node Version** : `18` ou `22` ou `25` (peu importe, >= 18)

## 🆘 Si ça ne fonctionne toujours pas

### Solution 1 : Vider complètement le Start Command

1. **Dans Render Settings**, trouvez **"Start Command"**
2. **EFFACEZ TOUT** (laissez vide)
3. **Sauvegardez**
4. Render devrait utiliser le Procfile ou `npm start`

### Solution 2 : Vérifier que le Procfile est sur GitHub

Le Procfile contient :
```
web: node activation-server.js
```

Vérifiez qu'il est bien sur GitHub :
```bash
# Vérifier sur GitHub
https://github.com/yahya-rl-2002/iptv-activation-server/blob/main/Procfile
```

### Solution 3 : Recréer le service

Si rien ne fonctionne :

1. **Notez** l'URL de votre service actuel
2. **Supprimez** le service dans Render
3. **Créez un nouveau service** :
   - Repository : `iptv-activation-server`
   - Name : `iptv-activation-server`
   - Environment : `Node`
   - Build Command : (vide)
   - **Start Command** : `node activation-server.js` ← **IMPORTANT**
   - Plan : `Free`

## 📝 Résumé

**ACTION IMMÉDIATE REQUISE :**

1. ✅ Allez dans Render > Settings > Start Command
2. ✅ Remplacez `node electron-main.js` par `node activation-server.js`
3. ✅ Sauvegardez
4. ✅ Vérifiez les logs

**C'EST LA SEULE CHOSE À FAIRE POUR RÉSOUDRE LE PROBLÈME !**

Le package.json et le Procfile sont corrects, mais Render les ignore et utilise ce qui est dans Settings.

