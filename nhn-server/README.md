# Hesab API-si

Hesab API-si Google Identity Services ilə giriş edir; profil, favori suallar, şəxsi sual paketləri və səsli oyun nəticələri `Account` Durable Object-lərində saxlanılır. Şəxsi paketlər yalnız onları yaradan hesabda görünür.

## Google OAuth konfiqurasiyası

1. Google Cloud Console-da **OAuth 2.0 Client ID** yaradın. Tətbiq növü **Web application** olmalıdır.
2. Authorized JavaScript origins siyahısına bunları əlavə edin:
   - `https://peaksel.az`
   - `https://www.peaksel.az`
3. Yaradılmış Client ID-ni `wrangler.jsonc` faylındakı `GOOGLE_CLIENT_ID` dəyərinə yazın.
4. `nhn-server` qovluğunda Worker-i yayımlayın:

   ```sh
   npx wrangler deploy
   ```

   Yayımlama `Account` Durable Object üçün `v2` migrasiyasını tətbiq edir. Mövcud `TURN_KEY_ID` və `TURN_KEY_TOKEN` secret-lərini Cloudflare-da saxlayın.
5. Saytın statik fayllarını da yayımlayın. Hesab düyməsi üçün `/account.js` faylı və `footer.js` yenilənməsi lazımdır.

OAuth Client ID public konfiqurasiyadır; private client secret tələb olunmur. Admin panelinin `admin/config.js` və `admin-worker` konfiqurasiyası ayrıca giriş üçündür və bu hesab API-sini konfiqurasiya etmir.

## Test

```sh
npm test
```
