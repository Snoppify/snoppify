module.exports = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title atttr1="hej">Snoppify - Refresh token</title>
        <style> 
          body {
            text-align: center;
            word-wrap: break-word;
          }
        </style>
      </head>
      <body>
        <h2>Snoppify</h2>

        <p><a href="{authUrl}">Get refresh token</a></p>

        <p>{refreshToken}</p>
      </body>
    </html>
`;
