# App Vendedor V6 — Capacitor + GPS em segundo plano

## O que esta versão faz
- Mantém o atendimento de estoque/pedido da V5.1.2.
- Adiciona **Iniciar expediente / Encerrar expediente**.
- No Android/iPhone, usa `@capgo/background-geolocation`.
- O plugin envia cada localização diretamente do código nativo ao webhook n8n `/reposicao-v6-gps-native`, então o envio não depende do JavaScript/WebView permanecer em primeiro plano.
- Intervalo padrão: **15 segundos**.
- Android mantém uma notificação persistente durante o expediente.
- O contexto da loja/visita é atualizado nos headers nativos.
- Ao confirmar um pedido, registra também um `orderEvent` no Supabase.

## Instalação
1. Instale Node.js compatível com Capacitor 8.
2. Nesta pasta: `npm install`
3. `npm run build`
4. Android: `npx cap add android` e depois `npm run android`
5. iOS (Mac): `npx cap add ios` e depois `npm run ios`
6. Aplique os snippets de permissões fornecidos.

## Android
Além das permissões de localização, `ACCESS_BACKGROUND_LOCATION` exige justificativa/fluxo adequado no Android moderno e, para publicação na Play Store, a finalidade precisa cumprir as políticas de localização em segundo plano. O serviço exibe uma notificação enquanto estiver rastreando.

## iPhone
Use permissão Always/Background Location. O iOS permite background location, mas **se o usuário encerrar o app manualmente**, o sistema operacional interrompe o rastreamento até o app ser aberto novamente.

## Segurança
A `SUPABASE_SERVICE_ROLE_KEY` nunca fica no aplicativo. O app envia GPS para o n8n com um token específico da jornada. O n8n é o único componente que usa a service_role.

## Rede sem sinal
O plugin utilizado faz POST nativo em background, porém a entrega é best-effort. Se o aparelho ficar sem rede por muito tempo e o processo morrer, alguns pontos podem ser perdidos. Para operação que exija fila nativa garantida/offline mesmo após morte do processo, use um plugin com persistência SQLite nativa ou acrescente uma fila nativa dedicada.

## Gerar APK sem configurar Android Studio local
O pacote inclui `.github/workflows/android-debug-apk.yml`. Suba a pasta para um repositório GitHub, abra **Actions > Build Android Debug APK > Run workflow** e baixe o artefato `reposicao-inteligente-debug-apk`. Esse APK é de teste/debug; para distribuição oficial é necessário configurar assinatura de release.
