# Video Chat — Acceso privado por contraseña

App de video chat aleatorio (tipo Chatroulette), gratuita, protegida con una sola
contraseña que solo tú conoces y compartes con quien quieras dar acceso.

## Qué incluye

- Emparejamiento aleatorio entre las personas conectadas.
- Video y audio en vivo (WebRTC) directo entre los dos navegadores.
- Botón "Siguiente" para cambiar de pareja.
- Botón "Reportar" que corta la llamada y deja un registro en el servidor.
- Confirmación de mayoría de edad + términos antes de poder entrar.
- Todo protegido por una contraseña única (nadie entra sin ella).

## 1. Instalar dependencias

Necesitas [Node.js](https://nodejs.org) instalado (versión 18 o más reciente).

```bash
npm install
```

## 2. Configurar tu contraseña

Copia `.env.example` como `.env`:

```bash
cp .env.example .env
```

Abre `.env` y cambia:

```
ACCESS_PASSWORD=pon-aqui-tu-clave-secreta
SESSION_SECRET=cualquier-texto-largo-y-aleatorio
```

`ACCESS_PASSWORD` es la contraseña que vas a compartir tú mismo con quien
quieras dar acceso. `SESSION_SECRET` es solo un texto aleatorio interno, no
lo compartas ni lo repitas en otro proyecto.

## 3. Probarlo en tu computadora

```bash
npm start
```

Abre `http://localhost:3000` en tu navegador.

## 4. Subirlo a internet (necesario para usarlo desde el celular)

La cámara solo funciona con conexión segura (https), así que necesitas
subir esto a un hosting. Opciones gratuitas/fáciles para este tipo de app
(con servidor Node.js corriendo, no solo archivos estáticos):

- **Railway** (railway.app) — conecta tu repositorio de GitHub o sube el
  código directo, agrega las variables de entorno (`ACCESS_PASSWORD`,
  `SESSION_SECRET`) en su panel, y despliega.
- **Render** (render.com) — mismo proceso: "New Web Service", conecta el
  repo, agrega las variables de entorno, comando de inicio `npm start`.
- **Fly.io** (fly.io) — un poco más técnico pero también gratuito para
  empezar.

En cualquiera de las tres, el paso importante es agregar las mismas
variables que tienes en tu `.env` dentro del panel de "Environment
Variables" del hosting (nunca subas el archivo `.env` a GitHub).

## 5. Compartir el acceso

Una vez desplegado, te dan un link (ej. `https://tuapp.up.railway.app`).
Compartes ese link + la contraseña únicamente con las personas que quieras
que entren.

## Notas importantes

- Esta versión usa un servidor STUN público de Google para conectar los
  videos. Para la mayoría de los casos es suficiente; si notas que algunas
  personas no logran conectar (redes muy restrictivas), se puede agregar un
  servidor TURN (implica costo, se puede hablar después si hace falta).
- El botón "Reportar" por ahora solo guarda un registro en los logs del
  servidor (verás el mensaje en la consola de tu hosting). Si más adelante
  quieres que te llegue un aviso por correo o WhatsApp cuando alguien
  reporta, se puede agregar.
- Puedes cambiar la contraseña en cualquier momento editando
  `ACCESS_PASSWORD` en las variables de entorno y reiniciando el servicio.
