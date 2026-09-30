# La Sélection CBK

Boutique en ligne (vitrine + commande WhatsApp) pour **La Sélection CBK** — faïence, grés,
sanitaire, baignoire, robinetterie, meubles de salle de bain, ciment colle, caro-joint et
étanchéité. GP9 Ain Zaghouan, Tunisie.

Site statique : **aucune dépendance, aucun build, aucun serveur**. Ouvrez `index.html` et
c'est en ligne.

---

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | La boutique : catalogue, recherche, filtres, tri, panier, commande WhatsApp, avis |
| `admin.html` | Le back-office : ajout / modification / suppression de produits, gestion du stock, avis clients |
| `assets/js/cbk-store.js` | **Couche de données partagée** par les deux pages (catalogue, panier, avis) |
| `assets/products/*.jpg` | Les photos produits |

### L'idée clé

Les deux pages lisent et écrivent le **même** catalogue via `CBK` (`assets/js/cbk-store.js`),
persisté dans le `localStorage` du navigateur. Concrètement :

- un produit ajouté dans `admin.html` apparaît réellement dans la boutique ;
- modifier un stock dans le back-office met à jour la fiche produit côté client ;
- si la boutique est ouverte dans **un autre onglet**, elle se rafraîchit toute seule
  (événement `storage` → `CBK.onChange`) ;
- le panier du visiteur survit à un rechargement de page.

---

## Démarrer

```bash
# n'importe quel serveur statique fait l'affaire
python3 -m http.server 8080
```

Puis : <http://localhost:8080/index.html> (boutique) et
<http://localhost:8080/admin.html> (administration).

> Ouvrir les fichiers en `file://` fonctionne aussi — le code est volontairement écrit
> sans modules ES pour rester compatible avec un simple double-clic.

---

## ⚙️ À configurer avant la mise en ligne

1. **Numéro WhatsApp** — dans `index.html` :

   ```js
   const WHATSAPP_NUMBER = "216XXXXXXXX";  // format international, chiffres uniquement
   ```

   Tant que le numéro n'est pas renseigné, le bouton de commande affiche un avertissement
   au lieu d'ouvrir un lien mort (le message de commande est visible dans la console).

2. **Téléphone et réseaux sociaux** — bas de page de `index.html`
   (`+216 XX XXX XXX`, liens Instagram / Facebook).

3. **Protéger `admin.html`** — la page est en `noindex`, mais elle n'est pas protégée par
   mot de passe. En production, placez-la derrière une authentification serveur
   (ex. Basic Auth Nginx / Netlify Identity) ou hors du dossier public.

---

## L'API `CBK`

```js
CBK.products()               // tout le catalogue
CBK.byId(12)                 // un produit
CBK.upsert({ ... })          // ajoute, ou met à jour si l'id existe
CBK.patch(12, { stock: 4 })  // modification partielle
CBK.remove(12)               // suppression
CBK.reset()                  // restaure le catalogue d'origine
CBK.onChange(fn)             // notifié à chaque changement (même depuis un autre onglet)

CBK.cart.get() / .set(c) / .clear()
CBK.feedback.all() / .add(entry)
CBK.stats()                  // { total, inStock, lowStock, outStock, value }
CBK.fmt(12.5)                // "12.50 TND"
CBK.esc(s)                   // échappement HTML
```

Les données vivent dans le `localStorage` sous `cbk.catalog.v1`, `cbk.cart.v1` et
`cbk.feedback.v1`. Les anciennes clés (`cbkCustomProducts`, `cbkFeedback`) sont reprises
automatiquement au premier chargement, rien n'est perdu.

Le back-office permet aussi d'**exporter le catalogue en JSON** — pratique pour
sauvegarder, ou pour le figer en dur dans `cbk-store.js` le jour où vous branchez
un vrai back-end.

---

## Limites connues

- Les données sont **locales au navigateur** : elles ne sont pas partagées entre
  deux appareils. C'est suffisant pour une vitrine gérée depuis un seul poste ;
  au-delà, il faudra une base de données.
- Pas de paiement en ligne : la commande part sur WhatsApp, volontairement.

© La Sélection CBK
