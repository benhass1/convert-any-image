# Recherche d’intégration C2PA

La bibliothèque officielle `@contentauth/c2pa-web` permet de lire les manifestes C2PA dans le navigateur. Avec Vite, la documentation recommande de créer l’instance avec le fichier Wasm fourni par le package, puis d’appeler `reader.fromBlob(mimeType, blob)` et `reader.manifestStore()` pour lire les données de provenance. Le lecteur et les ressources associées doivent être libérés après utilisation. La bibliothèque rejette les actifs dépassant 1 Go. [1]

Les Content Credentials sont des manifestes signés et inviolables : la validation établit si le manifeste présent est correctement lié au fichier et si la signature reste valide. L’absence d’un manifeste ne permet toutefois pas de conclure qu’une image est humaine, générée par IA, ou authentique. [2]

L’interface proposée doit donc rendre trois résultats explicites : **credential validé**, **credential présent mais non validé/illisible**, ou **aucun credential détecté**. Elle ne doit pas employer une probabilité de génération IA.

## Validation dans le navigateur

La vérification locale a été exercée dans Chromium contre la page View EXIF avec trois fixtures :

| Fixture | Résultat rendu |
| --- | --- |
| `c2pa-credential-present.jpg`, fixture officielle de `c2pa-web` | `CREDENTIAL VALIDATED` |
| `convert-any-image-logo.png`, image sans manifeste C2PA | `No Content Credential was found` |
| `c2pa-unsupported.txt`, fichier hors format image | `Content Credentials could not be read` |

Ces essais confirment les trois états essentiels du parcours réel : provenance validée lorsque le lecteur retourne un succès explicite, absence non concluante de credential et format non lisible.

## Sources

[1] [c2pa-web — guide d’installation et lecture des manifestes](https://github.com/contentauth/c2pa-js/blob/main/packages/c2pa-web/README.md)

[2] [C2PA FAQ — provenance et validation cryptographique](https://c2pa.org/faqs/)
