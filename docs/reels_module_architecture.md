# 🎬 Module Reels — Architecture & Plan de Travail
> **Glunity Mobile** · Expo SDK 55 / Node.js / MongoDB

---

## Principe directeur

Le module Reels est un **module entièrement autonome**. Il ne dépend pas du messaging-service.  
L'upload vidéo se fait directement dans l'`api/` via le client Cloudinary déjà existant (`api/src/app/integrations/cloudinary/cloudinary.client.js`).

### Flux global

```
[Mobile]
  │
  ├─ 1. Sélectionne une vidéo (galerie)
  ├─ 2. POST /api/reels/upload  ──────► [api/] → Cloudinary → retourne { videoUrl, thumbnailUrl, duration }
  ├─ 3. POST /api/reels         ──────► [api/] → Crée le document en base
  └─ 4. GET  /api/reels?page=X  ──────► [api/] → Feed paginé → Affiche dans ReelsFeedScreen
```

---

## Arborescence complète

> **Référence existante :**
> - Backend : copier la structure de `api/src/app/modules/channels/`
> - Mobile : copier la structure de `mobile/src/modules/community/`

```
glunity-mobile/
│
├── api/src/
│   ├── database/models/
│   │   └── reel.model.js              ← MODIFIER (upgrade schéma)
│   └── app/modules/
│       └── reels/                     ← CRÉER (module autonome)
│           ├── reels.routes.js        ← Routes + middleware upload multer
│           ├── reels.controller.js    ← Reçoit req/res, délègue au service
│           ├── reels.service.js       ← Toute la logique métier
│           ├── reels.repository.js    ← Requêtes MongoDB uniquement
│           ├── reels.schema.js        ← Validation Joi des inputs
│           └── reels.mapper.js        ← Transforme les documents DB en DTO
│
└── mobile/src/modules/
    └── reels/                         ← CRÉER (module autonome)
        ├── hooks/
        │   └── useReelsFeed.ts        ← Logique métier + état
        ├── services/
        │   └── reels.service.ts       ← Appels HTTP isolés
        └── ui/
            ├── screens/
            │   ├── ReelsFeedScreen.tsx
            │   └── ReelCameraScreen.tsx
            └── components/
                ├── ReelPlayerItem.tsx
                ├── ReelActionsOverlay.tsx
                └── ReelCommentSheet.tsx
```

---

## Bonnes pratiques — Règles communes aux deux devs

| Règle | Explication |
|---|---|
| **Module autonome** | Le module Reels n'importe rien du module `channels` ou du `messaging-service`. Zéro couplage. |
| **Séparation des couches** | Routes → Controller → Service → Repository. Chaque couche a un seul rôle. |
| **Stats dénormalisées** | `likesCount`, `viewsCount`, `commentsCount` sont stockés sur le document Reel lui-même. Évite les jointures sur le feed. |
| **Client Cloudinary existant** | Utiliser `api/src/app/integrations/cloudinary/cloudinary.client.js` (`uploadBuffer`). Ne pas recréer de client. |
| **Multer en mémoire** | L'upload vidéo utilise `multer({ storage: memoryStorage() })` — même pattern que le module `uploads` existant. |
| **Like optimiste côté mobile** | L'UI se met à jour immédiatement. Si le réseau échoue → rollback. |
| **Un seul player actif** | Pause automatique quand un reel sort du viewport (< 80% visible). |
| **Réutiliser `http.client.ts`** | Ne jamais utiliser `fetch` directement. Le client existant gère le JWT, les interceptors et les erreurs. |

---

---

# 👨‍💻 DEV 1 — Backend (`api/`)

> **Périmètre :** `api/src/database/models/reel.model.js` + `api/src/app/modules/reels/`
> **Référence à lire avant de commencer :** `api/src/app/modules/channels/` (structure identique)

---

## 🟢 T1 — FACILE · Upgrade du modèle Reel

**Fichier :** `api/src/database/models/reel.model.js`

Le modèle actuel est minimal. Ajouter les champs suivants :

| Champ | Type | Valeur par défaut | Rôle |
|---|---|---|---|
| `thumbnailUrl` | String | requis | Poster affiché pendant le buffering |
| `duration` | Number | `0` | Durée en secondes |
| `audioTitle` | String | `''` | Nom du son/musique |
| `status` | Enum | `'processing'` | `processing` → `ready` → `failed` |
| `viewsCount` | Number | `0` | Compteur dénormalisé |
| `likesCount` | Number | `0` | Compteur dénormalisé |
| `commentsCount` | Number | `0` | Compteur dénormalisé |
| `likedBy` | `[ObjectId → User]` | `[]` | Pour `isLiked` en O(1) sans jointure |
| `channelRef` | ObjectId → Channel | `null` | Partage optionnel dans une communauté |

**Index composé à ajouter** (feed trié, filtré sur `ready`) :
```js
reelSchema.index({ status: 1, createdAt: -1 });
```

> ✅ **Critère de succès :** `node -e "require('./api/src/database/models/reel.model.js')"` sans erreur.

---

## 🟢 T2 — FACILE · Routes

**Fichier à créer :** `api/src/app/modules/reels/reels.routes.js`

S'inspirer de `channels.routes.js`. Tous les appels nécessitent `authMiddleware`.

```
POST   /api/reels/upload        → Upload vidéo (multipart) → Cloudinary → retourne URLs
GET    /api/reels                → Feed paginé (?page=0&limit=10)
POST   /api/reels                → Créer un reel (avec les URLs retournées par /upload)
DELETE /api/reels/:id            → Supprimer son propre reel
POST   /api/reels/:id/like       → Toggle like (ajoute ou retire)
POST   /api/reels/:id/view       → Enregistrer une vue
GET    /api/reels/:id/comments   → Lister les commentaires
POST   /api/reels/:id/comments   → Poster un commentaire
```

**Middleware multer pour la route `/upload` :**
```js
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
// La route upload utilise upload.single('video') avant le controller
router.post('/upload', authMiddleware, upload.single('video'), controller.uploadVideo);
```

**Enregistrer dans `app.js`** (section "API Routes") :
```js
const reelsRoutes = require('./modules/reels/reels.routes');
app.use('/api/reels', reelsRoutes);
```

> ✅ **Critère de succès :** `GET /api/reels` retourne `200 { success: true, data: [] }`.

---

## 🟢 T3 — FACILE · Schéma de validation

**Fichier à créer :** `api/src/app/modules/reels/reels.schema.js`

Utiliser Joi comme dans `channels.schema.js` :

- **Création reel :** `videoUrl` (string URL), `thumbnailUrl` (string URL), `caption` (string, max 500), `duration` (number)
- **Commentaire :** `text` (string, 1-500 caractères, requis)

> ✅ **Critère de succès :** Un POST avec `caption` vide passe. Un POST sans `videoUrl` retourne 400.

---

## 🟡 T4 — MODÉRÉE · Upload vidéo (controller + service)

**Fichiers :** `reels.controller.js` (méthode `uploadVideo`) + `reels.service.js` (méthode `uploadVideo`)

Le controller lit `req.file.buffer` (mis en mémoire par multer) et délègue au service.  
Le service appelle `cloudinaryClient.uploadBuffer()` qui existe déjà.

**Options spécifiques vidéo à passer à `uploadBuffer` :**
```js
{
  resource_type: 'video',
  folder: 'glunity/reels',
  mimetype: file.mimetype,
  filename: file.originalname,
  eager: [
    { width: 720, height: 1280, crop: 'limit', quality: 'auto', format: 'mp4' },
    { width: 480, height: 854,  crop: 'limit', quality: 'auto:low', format: 'mp4' },
  ],
  eager_async: false,
}
```

**Réponse retournée au mobile :**
```json
{
  "success": true,
  "data": {
    "videoUrl": "https://res.cloudinary.com/.../720p.mp4",
    "thumbnailUrl": "https://res.cloudinary.com/.../poster.jpg",
    "duration": 15
  }
}
```

> ✅ **Critère de succès :** POST `/api/reels/upload` avec une vidéo test retourne les 3 champs.

---

## 🟡 T5 — MODÉRÉE · Service — Feed + Interactions

**Fichier :** `api/src/app/modules/reels/reels.service.js`

Toute la logique métier est ici. Le controller ne fait que valider et appeler ce service.

**`list({ userId, page, limit })` — Feed paginé :**
- Filtrer `status: 'ready'` uniquement
- Trier `createdAt: -1`
- `.populate('authorId', 'fullName avatarUrl')`
- Après le `.lean()`, ajouter `isLiked: r.likedBy.includes(userId)` sur chaque item

**`toggleLike(reelId, userId)` — Atomique :**
- Vérifier si `userId` est dans `likedBy`
- Si oui → `$pull` + `$inc likesCount: -1`
- Si non → `$addToSet` + `$inc likesCount: +1`
- Tout en **une seule** opération `findByIdAndUpdate` pour éviter les race conditions

**`recordView(reelId)` :**
- Simple `$inc: { viewsCount: 1 }`. Pas de garde (c'est le mobile qui contrôle l'unicité par session)

**`create(payload, userId)` :**
- Crée le document avec `status: 'ready'` directement (l'upload est déjà terminé)

> ✅ **Critère de succès :** Appeler `toggleLike` deux fois → `likesCount` revient à 0.

---

## 🔴 T6 — COMPLEXE · Repository + Mapper

**`reels.repository.js`** — Uniquement des requêtes MongoDB, aucune logique :
```
findFeed({ status, sort, skip, limit, populate })
findById(id)
updateById(id, update, options)
create(payload)
deleteById(id)
```

**`reels.mapper.js`** — Transforme un document Mongoose en DTO propre envoyé au mobile :
- Renommer `_id` → `id`
- Supprimer le tableau `likedBy` (remplacé par `isLiked: boolean`)
- Aplatir `authorId` → `author: { id, fullName, avatarUrl }`

> ✅ **Critère de succès :** La réponse de `GET /api/reels` ne contient pas de tableau `likedBy`.

---

---

# 👨‍💻 DEV 2 — Mobile (`mobile/src/modules/reels/`)

> **Périmètre :** Tout le dossier `mobile/src/modules/reels/`
> **Référence à lire avant de commencer :** `mobile/src/modules/community/` (même structure hooks/services/ui)

---

## 🟢 T7 — FACILE · Service HTTP

**Fichier à créer :** `mobile/src/modules/reels/services/reels.service.ts`

Utiliser **uniquement** `http` importé de `mobile/src/core/network/http.client.ts`. Ne jamais utiliser `fetch`.

**Interface TypeScript à définir en haut du fichier :**
```ts
export interface Reel {
  _id: string;
  author: { id: string; fullName: string; avatarUrl?: string };
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  duration: number;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isLiked: boolean;
  createdAt: string;
}
```

**Méthodes du service :**

| Méthode | Appel HTTP |
|---|---|
| `getFeed(page, limit?)` | `GET /reels?page=X&limit=10` |
| `toggleLike(reelId)` | `POST /reels/:id/like` |
| `recordView(reelId)` | `POST /reels/:id/view` |
| `uploadVideo(formData)` | `POST /reels/upload` avec `Content-Type: multipart/form-data` |
| `createReel(payload)` | `POST /reels` avec `{ videoUrl, thumbnailUrl, caption, duration }` |

> ✅ **Critère de succès :** Appel `ReelsService.getFeed(0)` dans un composant test → retourne un tableau.

---

## 🟢 T8 — FACILE · Câblage Navigation

**Fichier à modifier :** Navigateur principal (Stack contenant `Community`, `MessagingHome`, etc.)

Ajouter l'écran dans le Stack :
```tsx
<Stack.Screen
  name="ReelsFeed"
  component={ReelsFeedScreen}
  options={{ headerShown: false, gestureEnabled: true }}
/>
```

Corriger le bouton dans `BottomNavBar` (actuellement pointe vers `'Community'`) :
```tsx
// AVANT
onPressReels={() => navigation.navigate('Community')}

// APRÈS
onPressReels={() => navigation.navigate('ReelsFeed')}
```

> ✅ **Critère de succès :** Taper sur l'icône Reels dans la navbar → navigation vers l'écran (même vide).

---

## 🟡 T9 — MODÉRÉE · Hook `useReelsFeed`

**Fichier à créer :** `mobile/src/modules/reels/hooks/useReelsFeed.ts`

Ce hook est le cerveau du module mobile. **L'écran ne contient aucune logique** — seulement du JSX.

**État interne :**

| Variable | Type | Rôle |
|---|---|---|
| `reels` | `Reel[]` | Liste chargée |
| `loading` | `boolean` | Chargement en cours |
| `refreshing` | `boolean` | Pull-to-refresh actif |
| `hasMore` | `boolean` | Pages restantes |
| `pageRef` | `useRef(0)` | Numéro de page — `useRef` et non `useState` pour ne pas déclencher de re-render |

**Fonctions exposées :**

| Fonction | Comportement |
|---|---|
| `fetchFeed(reset?)` | Charge la page courante. `reset=true` → repart de la page 0 |
| `refresh()` | Set `refreshing=true` + `fetchFeed(true)` |
| `loadMore()` | Appelé par FlatList en fin de liste. Charge la page suivante si `hasMore && !loading` |
| `toggleLike(reelId)` | **Optimiste** : met à jour l'UI immédiatement, rollback si erreur API |

**Pattern like optimiste à respecter :**
```
1. Mettre à jour le state local (UI réactive, sans latence réseau)
2. Appeler ReelsService.toggleLike() en arrière-plan
3. En cas d'erreur → inverser la mise à jour (rollback)
```

> ✅ **Critère de succès :** Le compteur de like se met à jour sans délai visible. En cas d'erreur réseau, il revient à l'état précédent.

---

## 🟡 T10 — MODÉRÉE · Écran Feed `ReelsFeedScreen`

**Fichier à créer :** `mobile/src/modules/reels/ui/screens/ReelsFeedScreen.tsx`

Écran principal. C'est une `FlatList` verticale avec scroll snap.  
**Tout l'état vient de `useReelsFeed`** — l'écran ne contient que du JSX.

**Configuration FlatList critique :**

| Prop | Valeur | Raison |
|---|---|---|
| `pagingEnabled` | `true` | Snap sur chaque item |
| `snapToInterval` | `screenHeight` | Chaque reel = 100% hauteur écran |
| `decelerationRate` | `"fast"` | Arrêt rapide et précis |
| `getItemLayout` | précalculé | Élimine les re-mesures → scroll fluide |
| `windowSize` | `3` | Seuls 3 reels en mémoire simultanément |
| `removeClippedSubviews` | `true` | Libère les vues hors écran côté natif |
| `initialNumToRender` | `2` | Charge 2 reels au démarrage |

**Gestion du reel actif :**
```
1. Déclarer VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 80 }
2. Un reel est "actif" quand il est visible à 80%+ du viewport
3. Stocker activeIndex dans un useState local
4. Passer isActive={index === activeIndex} à chaque ReelPlayerItem
```

> ⚠️ **Piège :** Mettre `viewabilityConfig` et `onViewableItemsChanged` dans un `useRef` stable — sinon React Native lance un warning et le scroll se détraque.

> ✅ **Critère de succès :** Le scroll snape proprement sur chaque reel. La liste se recharge automatiquement en fin de scroll.

---

## 🔴 T11 — COMPLEXE · Composant Player `ReelPlayerItem`

**Fichier à créer :** `mobile/src/modules/reels/ui/components/ReelPlayerItem.tsx`

Composant le plus technique. Gère le cycle de vie du player vidéo.

**Stack de calques (de bas en haut) :**
```
[View  height=screenHeight, width=screenWidth, backgroundColor='#000']
  ├── <Image thumbnailUrl />         → Poster immédiat (s'affiche pendant le buffering)
  ├── <VideoView player />           → Par-dessus le poster (absoluteFillObject)
  ├── <View gradient />              → Dégradé sombre en bas (lisibilité texte)
  ├── <View meta />                  → Auteur + caption + son (bas gauche)
  └── <View actions />               → Like / Commentaire / Partage (droite)
```

**Cycle de vie du player `expo-video` :**
```ts
const player = useVideoPlayer(reel.videoUrl, p => {
  p.loop = true;
  p.muted = false;
});

useEffect(() => {
  if (isActive) {
    player.play();
  } else {
    player.pause();
    player.seekBy(-player.currentTime); // retour au début
  }
}, [isActive]);
```

**Points de détail :**
- `<Image>` et `<VideoView>` en `StyleSheet.absoluteFillObject` avec `resizeMode="cover"` → pas de bords noirs
- Si `authorId.avatarUrl` est vide → fallback `ui-avatars.com` avec initiales + couleur brand Glunity
- `showsPlaybackControls={false}` sur VideoView — l'UI custom gère tout

> ✅ **Critère de succès :** La vidéo se lance au scroll vers le reel, se met en pause au scroll suivant, le poster s'affiche instantanément.

---

## 🔴 T12 — COMPLEXE · Écran Caméra `ReelCameraScreen`

**Fichier à créer :** `mobile/src/modules/reels/ui/screens/ReelCameraScreen.tsx`

Permet de sélectionner une vidéo et de la publier.

**Flux UX :**
```
1. Bouton "+" dans le feed → ouvre cet écran
2. Demander permission MediaLibrary (expo-image-picker)
3. Ouvrir galerie → sélectionner vidéo (max 60s)
4. Prévisualiser la vidéo + saisir une caption
5. Appuyer "Publier" :
     a. ReelsService.uploadVideo(formData)  → Cloudinary → { videoUrl, thumbnailUrl, duration }
     b. ReelsService.createReel({ videoUrl, thumbnailUrl, caption, duration })
     c. Naviguer vers ReelsFeed + rafraîchir le feed
```

**États de l'écran :**

| État | Affichage |
|---|---|
| `idle` | Formulaire (aperçu + caption + bouton publier) |
| `uploading` | Spinner + "Upload en cours..." |
| `done` | Navigation automatique vers le feed |
| `error` | Message d'erreur + bouton réessayer |

> ✅ **Critère de succès :** Publier une vidéo test → elle apparaît dans le feed après navigation.

---

## Planning suggéré

```
Semaine 1
  Dev 1 → T1 (modèle) + T2 (routes) + T3 (validation)
  Dev 2 → T7 (service HTTP) + T8 (navigation) + T9 (hook) [peut mocker l'API]

Semaine 2
  Dev 1 → T4 (upload) + T5 (service métier)
  Dev 2 → T10 (FeedScreen) + T11 (PlayerItem)

Semaine 3
  Dev 1 → T6 (repository + mapper) + endpoint commentaires
  Dev 2 → T12 (CameraScreen) + ReelCommentSheet

Sync quotidien : vérifier l'alignement sur le contrat d'interface ci-dessous.
```

---

## Contrat d'interface Dev 1 ↔ Dev 2

> Dev 2 peut mocker ces réponses en attendant que Dev 1 finalise les endpoints.

| Endpoint | Méthode | Entrée | Réponse |
|---|---|---|---|
| `/api/reels/upload` | POST | `multipart/form-data` champ `video` | `{ success: true, data: { videoUrl, thumbnailUrl, duration } }` |
| `/api/reels` | GET | `?page=0&limit=10` | `{ success: true, data: Reel[] }` |
| `/api/reels` | POST | `{ videoUrl, thumbnailUrl, caption, duration }` | `{ success: true, data: Reel }` |
| `/api/reels/:id/like` | POST | — | `{ success: true, data: { liked: boolean } }` |
| `/api/reels/:id/view` | POST | — | `{ success: true }` |
| `/api/reels/:id/comments` | GET | — | `{ success: true, data: Comment[] }` |
| `/api/reels/:id/comments` | POST | `{ text: string }` | `{ success: true, data: Comment }` |
| `/api/reels/:id` | DELETE | — | `{ success: true }` |
