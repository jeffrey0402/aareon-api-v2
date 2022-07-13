# Aareon API



## Nodig om de API te runnen:

[Nodejs 16.x]( https://nodejs.dev/)

Java

[pnpm](https://pnpm.io/installation)



Java is nodig om XML te valideren. 

Meer info: https://github.com/nikku/node-xsd-schema-validator#readme



## Gebruik: 

Installeer packages: `npm i`

Run dev environment: `npm run dev`

Build project (linux): `npm run build`

Build project (all) `npm run buildall`



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
DATABASE_URL="sqlserver://jeffreyroossien.nl:1433;database=database_1;user=nhlstenden;password=***REMOVED***;trustServerCertificate=true;encrypt=false"
```