# Pistes de design — Convert Any Image

## Trois directions explorées

| Thème | Introduction très brève | Probabilité |
|---|---|---:|
| **Editorial Atelier** | Une interface claire et technique, structurée comme une table de montage photographique. Elle inspire confiance par la précision plutôt que par l’effet. | 0.07 |
| **Signal Utility** | Un outil à haute lisibilité qui emprunte au design industriel, aux repères typographiques et aux contrôles matériels. | 0.04 |
| **Cloud Darkroom** | Un laboratoire numérique profond, animé par des couches translucides et des tons minéraux. Il rend le traitement d’images palpable et apaisant. | 0.09 |

## Direction retenue — Signal Utility

### Design Movement

Le design s’inspire du **modernisme éditorial suisse**, réinterprété comme un poste de commande photographique contemporain. Le résultat doit privilégier la clarté fonctionnelle, des repères francs et une densité maîtrisée.

### Core Principles

1. **Lisibilité avant décoration** : chaque ligne, couleur et zone d’ombre signale une action, un état ou une hiérarchie.
2. **Asymétrie structurée** : une large zone d’outil est équilibrée par un rail d’informations et de réglages, plutôt qu’un unique bloc centré.
3. **Matière numérique discrète** : un quadrillage fin, du grain et des micro-contrastes évoquent une table lumineuse sans voler la vedette au contenu.
4. **Confiance vérifiable** : l’interface rend la confidentialité et les étapes de traitement visibles, avec une progression explicite par fichier.

### Color Philosophy

La base ivoire légèrement chaude rend l’outil accueillant et moins clinique. Le bleu encre assoit la technicité, tandis que le **vert signal** qualifie les états actifs, les gains de compression et les conversions terminées. Les surfaces sombres sont réservées aux zones d’exécution et aux informations machine pour créer une véritable hiérarchie, jamais pour produire un effet décoratif.

### Layout Paradigm

La page fonctionne comme un **plan de travail en L** : une navigation éditoriale fine, une zone de manipulation dominante, puis un rail vertical contextuel affichant les formats et les paramètres. Les pages de contenu reprennent cette logique avec des marges de lecture généreuses et des blocs de métadonnées ancrés à gauche.

### Signature Elements

1. Un **repère de format** carré, bleu encre et vert signal, accompagne les sections et états importants.
2. Un **quadrillage de table lumineuse** très subtil constitue le fond de certaines zones de traitement.
3. Des **pills de statut numérotées**, façon étiquettes de laboratoire, rendent l’avancement immédiatement perceptible.

### Interaction Philosophy

Les interactions doivent être directes et instrumentales : les boutons réagissent par un léger enfoncement, les zones de dépôt s’illuminent à l’approche, et les paramètres changent avec des retours chiffrés explicites. Aucun mouvement ne doit masquer un changement d’état ou ralentir une action fréquente.

### Animation

Les changements d’état utilisent un fondu et un décalage vertical léger, inférieur à 220 ms, avec une courbe d’accélération franche. Le quadrillage peut dériver imperceptiblement dans la zone de dépôt. Les barres de progression se remplissent de gauche à droite avec un marqueur de phase ; l’interface respecte `prefers-reduced-motion` et supprime les mouvements non essentiels.

### Typography System

**Space Grotesk** est réservé aux titres, libellés de commande et métriques pour son dessin précis et technique. **Source Serif 4** est utilisée dans le blog et les explications de confidentialité afin d’apporter du confort de lecture. Les titres alternent de manière intentionnelle entre capitales compactes et casse phrase ; les micro-libellés sont en petites capitales espacées.

### Brand Essence

**Convert Any Image est le laboratoire privé, rapide et lisible qui transforme les images sur l’appareil de créateurs exigeants.**

Personnalité : **précis**, **protecteur**, **direct**.

### Brand Voice

La voix est calme, concrète et orientée résultat. Les titres annoncent clairement l’action ; les CTA décrivent leur effet sans superlatif vide.

> « Déposez vos fichiers. Rien ne quitte votre appareil. »

> « Réduisez le poids, préservez l’intention. »

### Wordmark & Logo

Le symbole est une **lentille carrée ouverte** : un cadre technique incomplet qui embrasse un disque de couleur signal, suggérant simultanément cadrage, conversion et passage de format. Le mot-symbole utilise Space Grotesk en approche serrée, avec un point vert signal dans le « a » de `any` sur les applications de marque.

### Signature Brand Color

**Vert Signal `#B7F840`** — une couleur propriétaire, énergique et immédiatement reconnaissable, utilisée avec parcimonie pour les actions et résultats positifs.

## Style Decisions

- Le **vert signal `#B7F840`** est réservé aux contrôles actifs, preuves de traitement local, résultats terminés, chiffres clés et repères de format carrés ; il n’est jamais employé comme aplat décoratif de grand titre.
- Toute page non-outil conserve la structure en L de Signal Utility grâce à un rail de métadonnées visible, des labels de statut ou des marqueurs de cadrage carrés.
- Les articles et cartes éditoriales se lisent comme des notes de laboratoire : Space Grotesk pour la signalétique et les titres, Source Serif 4 exclusivement pour les passages explicatifs continus.
- Les grands titres privilégient une promesse concrète et vérifiable de traitement local plutôt qu’une formulation SEO générique ; la voix reste calme, directe et protectrice.
- Chaque section de contenu non-outil comporte au moins un artefact Signal Utility : marqueur de format carré, repère numéroté, rail de métadonnées ou séparateur de type machine.
- Les aplats vert pâle restent limités aux zones de traitement actives et aux preuves explicites de confidentialité locale ; ailleurs, le vert signal est un accent de commande, de statut ou de résultat.
- Sur les pages d’inspection, les grands titres restent couleur encre ; le vert signal qualifie les statuts, repères de phase, données locales et actions plutôt qu’une emphase décorative.
- Les zones d’aide d’un outil reprennent la structure du poste de commande grâce à un rail de notes, des identifiants de phase, des carrés de format et des séparateurs de type machine.
