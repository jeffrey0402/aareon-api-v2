# Aareon API



## Nodig om de API te runnen:

[Nodejs 16.x]( https://nodejs.dev/)

Java 8 of nieuwer (java en javac in path)



Java is nodig om XML te valideren. 

Meer info: https://github.com/nikku/node-xsd-schema-validator#readme



## Gebruik: 

Installeer packages: `npm i`

Run dev environment: `npm run dev`

Build project (servers / deployment, linux only): `npm run build`

Build project (all) `npm run buildall`

Run gebuild project: `node build/server.js`



## Deployment:

Nadat build gerund heeft,  zullen de gecompileerde `.js ` bestanden in de build folder staan. Dit kan gehost worden met de process manager [pm2](https://pm2.keymetrics.io/).

Onderstaand script kan worden aangeroepen om de API te updaten:

```bash
#!/bin/sh
cd /home/jeffrey/aareon/Aareon-Api
git pull
npm i
npm run build
pm2 restart ecosystem.config.js
```



## Api requests:

De enige request die in de productie omgeving in gebruik genomen zal worden is de /addData POST endpoint.

Deze endpoint verwacht het volgende JSON format:

```JSON
[

  {

   "bn":"urn:dev:DEVEUI:0018B21000008C47:",

   "bt":1654194188

  },

  {

   "n":"payload",

   "vs":"6a0000e42c01a900e42c01a500e42c01a500e42c01a600e42c01a900e42c01ab"

  },

  {

   "n":"port",

   "v":1

  }

]
```



Overige endpoints zijn te vinden in `routes/routes.ts`, en verwachten voor de POST Requests de waarden die te vinden zijn in de JSON schemas te vinden in `/source/schemas/draft-07`, en XML in de map: `xsd`

De GET requests versturen data in hetzelfde format.

De UPDATE requests verwachten de alle data van de rij die aangepast moet worden, en verwacht als query param de id/naam.

De DELETE requests verwachten de ID van de rij dat uit de tabel verwijderd moeten worden.



### XML en JSON

Alle overige endpoints ondersteunen zowel verzenden en ontvangen van XML en JSON. 

In de request header moet de applicatie specificeren wat gebruikt moet worden via de 

`Content-Type` header. 

Via de `Accept` Header kan gespecificeerd worden welk format de return data moet hebben.

Beide headers kunnen de waarden `application/json` of `application/xml` hebben.

## .env file 

```
# server configuration
PORT=8080

# database
DATABASE_URL="sqlserver://jeffreyroossien.nl:1433;database=database_1;user=nhlstenden;password=password;trustServerCertificate=true;encrypt=false"
```



## Werking

Deze api verwerkt de endpoints op basis van de content-type van de body, en valideert de xml of json body.

Vervolgens wordt de data in de database gezet met behulp van een ORM genaamd prisma.



## Onderhoud

Nieuwe endpoints kunnen worden aangemaakt in de routes map, en vervolgens in routes.ts toegevoegd worden. Schema's moeten voor deze endpoints nog wel aangemaakt worden.

Om nieuwe endpoints toe te voegen, moet als eerst de nieuwste versie van de database tabellen "gepulled" worden. Dit kan met `npx prisma db pull`. Meer info op [prisma.io]( https:/prisma.io/client)

Vervolgens moet gecontroleerd worden of de huidige endpoints nog werken. 

Wanneer dit gedaan is, kan in de routes folder een nieuwe endpoint gemaakt worden. Zie voor referentie hiervoor `routes/users.ts`

Deze route kan vervolgens in `routes/routes.ts` geimporteerd worden.

Indien nodig kunnen schema's worden gebruikt om de input van de request body te valideren. De XSD schemas zijn te vinden in `xsd`, en de draft-07 schema's in `schemas/draft-07`.

## Structuur

De structuur van de applicatie is verder als volgt:

- `functions`: Functies die meerdere endpoints of bestanden gebruiken.
- `prisma`: De map met prisma schema's en andere prisma bestanden. Nodig voor de Prisma module.
- `routes`: Routes voor de endpoints. Deze routes moeten verder in routes.ts Worden geimporteerd.
- `schemas/draft-07`: draft-07 json schemas. Deze schemas kunnen hier staan, omdat deze geimporteerd kunnen worden in de TS compiler.
- `xsd`: XSD schema's. Deze staan op deze specifieke locatie, omdat de TS compiler deze bestanden niet mee neemt bij de ts > js stap, en dus niet in de build folder zal staan.
- `visualisatie`: Niet nodig voor de werking van de applicatie, maar bevat webpagina's waarop de sensor data in een grafiek te zien is.

Overige bestanden:

- `.env`: Bevat environment variables. Niet nodig voor werking wanneer deze variabelen in de command line meegegeven worden.
- `.eslint.json`: eslint configuratie. Niet nodig voor de werking, maar zorgt voor een consistente coding style.
- `.ecosystem.config.js`: pm2 config bestand. Nodig voor linux server deployment met pm2.
- `patch.js`: kleine patch zodat het type BigInt naar json geparsed kan worden. 
- `README.md`: Dit bestand
- `server.ts`: root van de applicatie, dit wordt als eerst uitgevoerd.
- `tsconfig.json`: TS compiler configuratie.