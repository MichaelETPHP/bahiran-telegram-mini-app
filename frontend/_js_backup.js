<script>
// ════ STATE ════
var TOKEN_KEY='bahiran_token';

// ─── AUTH: LocalStorage keys for JWT session persistence (48h auto-login) ───
var BH_TOKEN_KEY = 'bh_token';
var BH_USER_KEY = 'bh_user';
var BH_TOKEN_EXP_KEY = 'bh_token_exp';

const S={
  lang:'en',loggedIn:false,
  authToken:(function(){
    try{
      // Check for stored JWT token (48h session)
      var exp = localStorage.getItem(BH_TOKEN_EXP_KEY);
      if(exp && Date.now() < parseInt(exp, 10)){
        var jwt = localStorage.getItem(BH_TOKEN_KEY);
        if(jwt) return jwt;
      }
      // Expired or missing - clear stale data
      clearAuthStorage();
      return '';
    }catch(e){return '';}
  })(),
  user:{name:'',username:'',phone:'',location:'Addis Ababa',initial:'M',telegramId:'',photoUrl:''},
  cart:[],currentRest:null,loved:{},
  addresses:[
    {id:1,type:'home',icon:'🏠',label:'Home',detail:'Bole, Addis Ababa'},
    {id:2,type:'office',icon:'🏢',label:'Office',detail:'Piassa, Addis Ababa'},
  ],
  selAddr:1,selAddrType:'home',
  currentScreen:'login-screen',prevScreen:null,
  payMethod:'chapa',pendingOrder:null,
  sheetItem:null,confirmCode:null,
};

// ════ DATA ════
const D={
  offers:[
    {id:101,emoji:'🥘',name:'Doro Wat',desc:'Spicy Ethiopian chicken stew with injera and boiled egg. A classic comfort dish.',restId:1,restName:'Habesha Restaurant',price:155,old:190,disc:18},
    {id:201,emoji:'🍔',name:'Double Stack Burger',desc:'Two premium beef patties with cheddar, caramelized onions and secret sauce.',restId:2,restName:'Burger Palace',price:176,old:220,disc:20},
    {id:301,emoji:'🍕',name:'Pepperoni Pizza',desc:'Loaded with premium pepperoni slices and perfectly melted mozzarella cheese.',restId:3,restName:'Pizza Corner',price:192,old:240,disc:20},
    {id:401,emoji:'🥩',name:'Mixed Grill Combo',desc:'Beef, chicken and lamb assortment with sides and fresh salad.',restId:4,restName:'Grill Master',price:336,old:420,disc:20},
  ],
  restaurants:[
    {id:1,emoji:'🏺',name:'Habesha Restaurant',nameAm:'ሐበሻ ምግብ ቤት',loc:'Bole, Addis Ababa',locAm:'ቦሌ፣ አ.አ.',rating:4.8,reviews:320,minTime:25,distKm:1.2,badge:'Popular'},
    {id:2,emoji:'🍔',name:'Burger Palace',nameAm:'በርገር ቤት',loc:'Mexico, Addis Ababa',locAm:'ሜክሲኮ፣ አ.አ.',rating:4.6,reviews:210,minTime:20,distKm:2.5,badge:'New'},
    {id:3,emoji:'🍕',name:'Pizza Corner',nameAm:'ፒዛ ቤት',loc:'CMC, Addis Ababa',locAm:'CMC፣ አ.አ.',rating:4.5,reviews:180,minTime:35,distKm:3.8,badge:''},
    {id:4,emoji:'🥩',name:'Grill Master',nameAm:'ግሪል ቤት',loc:'Kazanchis, Addis Ababa',locAm:'ካዛንቺስ፣ አ.አ.',rating:4.9,reviews:415,minTime:30,distKm:1.8,badge:'Top Rated'},
    {id:5,emoji:'🥗',name:'Green Garden',nameAm:'አረንጓዴ ቤት',loc:'Sarbet, Addis Ababa',locAm:'ሳርቤት፣ አ.አ.',rating:4.3,reviews:95,minTime:15,distKm:0.9,badge:''},
  ],
  menus:{
    1:{cats:['All','Mains','Starters','Drinks'],catsAm:['ሁሉም','ዋና','መጀመሪያ','መጠጥ'],items:[
      {id:101,cat:1,e:'🥘',n:'Doro Wat',nA:'ዶሮ ወጥ',d:'Spicy Ethiopian chicken stew with injera and boiled egg',p:180},
      {id:102,cat:1,e:'🍛',n:'Tibs',nA:'ጥብስ',d:'Sautéed tender beef with onions, tomatoes and rosemary',p:220},
      {id:103,cat:1,e:'🫓',n:'Firfir',nA:'ፍርፍር',d:'Torn injera cooked in spicy berbere sauce',p:120},
      {id:104,cat:1,e:'🍲',n:'Kitfo',nA:'ክትፎ',d:'Finely minced raw beef with mitmita and spiced butter',p:250},
      {id:105,cat:2,e:'🥗',n:'Fatira',nA:'ፋጢራ',d:'Crispy layered bread with egg, honey and butter',p:90},
      {id:106,cat:2,e:'🍢',n:'Sambusa',nA:'ሳምቡሳ',d:'Crispy fried pastry filled with spiced lentils',p:60},
      {id:107,cat:3,e:'☕',n:'Ethiopian Coffee',nA:'ቡና',d:'Traditional ceremony — 3 rounds of pure arabica',p:50},
      {id:108,cat:3,e:'🍯',n:'Tej',nA:'ጠጅ',d:'Traditional Ethiopian honey wine',p:70},
    ]},
    2:{cats:['All','Burgers','Sides','Drinks'],catsAm:['ሁሉም','በርገሮች','ጎን','መጠጥ'],items:[
      {id:201,cat:1,e:'🍔',n:'Classic Burger',nA:'ክላሲክ በርገር',d:'Juicy beef patty with lettuce, tomato, cheese and house sauce',p:150},
      {id:202,cat:1,e:'🍖',n:'Double Stack',nA:'ድብል ስታክ',d:'Two premium patties with cheddar and caramelized onions',p:220},
      {id:203,cat:1,e:'🐔',n:'Crispy Chicken Burger',nA:'ዶሮ በርገር',d:'Golden fried chicken fillet with sriracha mayo and coleslaw',p:160},
      {id:204,cat:2,e:'🍟',n:'French Fries',nA:'ፍራይ',d:'Golden crispy fries with seasoning salt',p:60},
      {id:205,cat:2,e:'🧅',n:'Onion Rings',nA:'ሽንኩርት ቀለበቶች',d:'Beer-battered crispy onion rings',p:70},
      {id:206,cat:3,e:'🥤',n:'Soft Drink',nA:'ሶፍት ዴሪንክ',d:'Coke, Pepsi, Sprite or Fanta 500ml',p:30},
      {id:207,cat:3,e:'🧋',n:'Mango Shake',nA:'ማንጎ ሼክ',d:'Fresh blended mango with milk and ice cream',p:80},
    ]},
    3:{cats:['All','Pizzas','Pasta','Drinks'],catsAm:['ሁሉም','ፒዛዎች','ፓስታ','መጠጥ'],items:[
      {id:301,cat:1,e:'🍕',n:'Margherita',nA:'ማርጌሪታ',d:'Classic tomato base, fresh mozzarella, basil leaves',p:200},
      {id:302,cat:1,e:'🍕',n:'Pepperoni',nA:'ፔፔሮኒ',d:'Loaded with premium pepperoni and melted cheese',p:240},
      {id:303,cat:1,e:'🍕',n:'BBQ Chicken',nA:'ቢቢኪው',d:'Grilled chicken, BBQ sauce, red onion, mozzarella',p:260},
      {id:304,cat:2,e:'🍝',n:'Spaghetti Bolognese',nA:'ስፓጌቲ',d:'Rich slow-cooked meat sauce over al dente spaghetti',p:180},
      {id:305,cat:2,e:'🍜',n:'Penne Arrabiata',nA:'ፔኔ',d:'Penne in spicy tomato and garlic sauce',p:160},
      {id:306,cat:3,e:'🧃',n:'Fresh Juice',nA:'ጁስ',d:'Avocado, mango or mixed fruit freshly squeezed',p:55},
    ]},
    4:{cats:['All','Grills','Combos','Drinks'],catsAm:['ሁሉም','ግሪሎች','ኮምቦ','መጠጥ'],items:[
      {id:401,cat:1,e:'🥩',n:'Ribeye Steak 300g',nA:'ሪባይ ስቴክ',d:'Premium dry-aged ribeye grilled to your liking with chimichurri',p:350},
      {id:402,cat:1,e:'🍗',n:'Grilled Chicken',nA:'ዶሮ ግሪል',d:'Half chicken marinated in lemon herb grilled over charcoal',p:280},
      {id:403,cat:1,e:'🦐',n:'Grilled Prawns',nA:'ሽሪምፕ',d:'Jumbo prawns with garlic butter and lemon',p:380},
      {id:404,cat:2,e:'🍱',n:'Mixed Grill Combo',nA:'ሚክስ ኮምቦ',d:'Beef, chicken and lamb with sides and salad',p:520},
      {id:405,cat:3,e:'🍺',n:'Draft Beer',nA:'ቢራ',d:'Cold local or imported draft beer 500ml',p:90},
      {id:406,cat:3,e:'🥤',n:'Fresh Lemonade',nA:'ሎሚ ጁስ',d:'Freshly squeezed lemon with mint and soda',p:60},
    ]},
    5:{cats:['All','Salads','Wraps','Juices'],catsAm:['ሁሉም','ሰላጣዎች','ራፖች','ጁሶች'],items:[
      {id:501,cat:1,e:'🥗',n:'Caesar Salad',nA:'ሳላዴ',d:'Crispy romaine, parmesan, croutons and caesar dressing',p:130},
      {id:502,cat:1,e:'🥗',n:'Greek Salad',nA:'ግሪክ ሰላጣ',d:'Feta, olives, cucumber, tomato and red onion',p:120},
      {id:503,cat:2,e:'🌯',n:'Veggie Wrap',nA:'ቬጂ ራፕ',d:'Grilled vegetables, hummus and feta in whole wheat wrap',p:150},
      {id:504,cat:2,e:'🌯',n:'Chicken Wrap',nA:'ዶሮ ራፕ',d:'Seasoned grilled chicken with fresh greens and tzatziki',p:160},
      {id:505,cat:3,e:'🥤',n:'Green Detox',nA:'ዲቶክስ',d:'Spinach, cucumber, lemon and ginger cold press',p:85},
      {id:506,cat:3,e:'🧃',n:'Avocado Juice',nA:'አቮካዶ ጁስ',d:'Creamy fresh avocado blended with milk and honey',p:75},
    ]},
  },
  orders:[],
};

// ════ TOAST ════
function toast(msg,type='info',duration=3000){
  const icons={success:'✅',error:'❌',info:'ℹ️'};
  const el=document.createElement('div');
  el.className=`toast ${type}`;
  el.innerHTML=`<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-msg">${msg}</span>`;
  document.getElementById('toast-wrap').appendChild(el);
  setTimeout(()=>{
    el.style.animation='toastOut .3s ease forwards';
    setTimeout(()=>el.remove(),300);
  },duration);
}

// ════ LANG ════
function setLang(lang,btn){
  S.lang=lang;
  document.querySelectorAll('.lmb').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  document.getElementById('lang-emoji').textContent=lang==='am'?'🇪🇹':'🇬🇧';
  document.getElementById('lang-code').textContent=lang==='am'?'አማ':'EN';
  if(S.currentScreen==='home-screen'){renderOffers();renderRestaurants();}
  if(S.currentScreen==='rest-screen'&&S.currentRest)openRestaurant(S.currentRest.id);
}
function toggleLang(){
  const nl=S.lang==='en'?'am':'en';setLang(nl);
  document.querySelectorAll('.lmb').forEach(b=>b.classList.toggle('active',b.textContent.includes(nl==='en'?'EN':'አማ')));
}

// ════ SCREENS ════
function showScreen(id,dir='fwd'){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active','back'));
  const el=document.getElementById(id);
  el.classList.add('active');
  if(dir==='back')el.classList.add('back');
  S.prevScreen=S.currentScreen;S.currentScreen=id;
  el.scrollTop=0;
  document.getElementById('bnav').classList.toggle('on',S.loggedIn&&id!=='login-screen');
  // show view cart bar on home and restaurant screens
  const t=S.cart.reduce((s,i)=>s+i.qty,0);
  const onAllowed=['home-screen','rest-screen'].includes(id);
  document.getElementById('vc-sticky').classList.toggle('show',t>0&&onAllowed);
  if(id==='profile-screen')updateProfileTokenInputs();
}
function updateProfileTokenInputs(){
  var reqEl=document.getElementById('profile-request-input');
  var tokEl=document.getElementById('profile-token-input');
  if(reqEl)reqEl.value=JSON.stringify({telegramId:String(S.user.telegramId||'')},null,2);
  if(tokEl)tokEl.value=S.authToken||'(not logged in)';
}
function navTo(id,el){
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
  if(el)el.classList.add('active');
  showScreen(id);
}
function goBack(){
  showScreen(S.prevScreen||'home-screen','back');
  if(S.prevScreen==='home-screen'){
    document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
    document.getElementById('ni-home').classList.add('active');
  }
}

// ════ LOCATION (default Addis Ababa; detect from recent/cached position) ════
const DEFAULT_CITY='Addis Ababa';
function requestLocationWithPermission(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation){reject(new Error('Geolocation not supported'));return;}
    navigator.geolocation.getCurrentPosition(
      async (pos)=>{
        const lat=pos.coords.latitude,lng=pos.coords.longitude;
        let city=DEFAULT_CITY;
        try{
          const r=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,{headers:{'Accept-Language':'en'}});
          const j=await r.json();
          city=j.address?.city||j.address?.town||j.address?.state||j.address?.country||city;
        }catch(_){}
        resolve({lat,lng,city});
      },
      (err)=>{reject(err);},
      {enableHighAccuracy:false,timeout:15000,maximumAge:600000}
    );
  });
}

function updateLoginLocUI(status,city){
  const el=document.getElementById('login-loc');
  if(!el)return;
  el.className='login-loc'+(status==='found'?' found':status==='denied'?' denied':'');
  if(status==='detecting')el.innerHTML='📡 Detecting location…';
  else if(status==='found')el.innerHTML='✅ Location: <strong>'+(city||DEFAULT_CITY)+'</strong>';
  else if(status==='denied')el.innerHTML='⚠️ Location denied — using <strong>'+DEFAULT_CITY+'</strong>';
}

function detectLoc(){
  const el=document.getElementById('login-loc');
  if(!el)return;
  requestLocationWithPermission()
    .then(({city})=>{
      if(S.user&&typeof S.user.location==='string')S.user.location=city;
      updateLoginLocUI('found',city);
    })
    .catch(()=>updateLoginLocUI('denied'));
}

function requestLocationEverywhere(callback){
  const el=document.getElementById('login-loc');
  if(el){updateLoginLocUI('detecting');}
  requestLocationWithPermission()
    .then(({lat,lng,city})=>{
      if(S.user&&typeof S.user.location==='string')S.user.location=city;
      const h=document.getElementById('h-city'),p=document.getElementById('p-loc');
      if(h)h.textContent=city;if(p)p.textContent='📍 '+city;
      if(el)updateLoginLocUI('found',city);
      if(callback)callback(city);
    })
    .catch(()=>{
      if(el)updateLoginLocUI('denied');
      if(callback)callback(null);
    });
}

function showSpinner(txt='Loading…'){document.getElementById('spin-txt').textContent=txt;document.getElementById('spinner').classList.add('show');}
function hideSpinner(){document.getElementById('spinner').classList.remove('show');}

// ════ BAHIRAN BACKEND API (https://api.bahirandelivery.cloud) ════
// When served by our server, __BAHIRAN_API_BASE_URL__ is injected as '' so API calls go to same origin (proxied to external API)
var BAHIRAN_API_BASE='__BAHIRAN_API_BASE_URL__';
if(BAHIRAN_API_BASE.indexOf('__')===0)BAHIRAN_API_BASE='https://api.bahirandelivery.cloud';
if(BAHIRAN_API_BASE.length&&BAHIRAN_API_BASE.slice(-1)==='/')BAHIRAN_API_BASE=BAHIRAN_API_BASE.slice(0,-1);
var DEFAULT_TELEGRAM_ID='5576139140'; // Fallback when not in Telegram

// Development: API check (first) + error logs (next)
function devLog(tag,message,isError){
  if(isError)console.error('[Bahiran]',tag,message);
  else console.log('[Bahiran]',tag,message);
}
function devLogApiCall(method,path){devLog('API call',method+' '+path);}
function devLogApiOk(method,path,summary){devLog('API OK',method+' '+path+(summary?': '+summary:''));}
function devLogApiErr(method,path,err){devLog('API error',method+' '+path+' — '+(err&&err.message?err.message:String(err)),true);}
console.log('[Bahiran] dev — API base:',BAHIRAN_API_BASE,'| logs: API check first, then errors');

function bahiranApi(method,path,body){
  var url=BAHIRAN_API_BASE+path;
  devLogApiCall(method,path);
  var opts={method:method,headers:{}};
  if(S.authToken)opts.headers['Authorization']='Bearer '+S.authToken;
  if(body!=null){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(body);}
  return fetch(url,opts).then(function(r){return r.json();}).then(function(data){
    devLogApiOk(method,path);
    return data;
  }).catch(function(err){
    devLogApiErr(method,path,err);
    throw err;
  });
}

// ─── AUTH: Store session data in localStorage (48h auto-login) ───
function storeAuthSession(token, user) {
  try {
    const expiryMs = Date.now() + (48 * 60 * 60 * 1000);  // 48 hours
    localStorage.setItem(BH_TOKEN_KEY, token);
    localStorage.setItem(BH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(BH_TOKEN_EXP_KEY, String(expiryMs));
    localStorage.setItem(TOKEN_KEY, token);  // Legacy compatibility
  } catch (e) {
    devLog('Auth', 'Failed to store session - ' + (e.message || e), true);
  }
}

// ─── AUTH: Clear all auth data from localStorage ───
function clearAuthStorage() {
  try {
    localStorage.removeItem(BH_TOKEN_KEY);
    localStorage.removeItem(BH_USER_KEY);
    localStorage.removeItem(BH_TOKEN_EXP_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
}

// ─── AUTH: Check for valid session on app start (48h window) ───
function checkAutoLogin() {
  try {
    const token = localStorage.getItem(BH_TOKEN_KEY);
    const exp = localStorage.getItem(BH_TOKEN_EXP_KEY);
    const userJson = localStorage.getItem(BH_USER_KEY);

    if (!token || !exp || !userJson) return null;

    // Check client-side expiry
    if (Date.now() >= parseInt(exp, 10)) {
      devLog('Auth', 'Session expired - clearing');
      clearAuthStorage();
      return null;
    }

    const user = JSON.parse(userJson);
    devLog('Auth', 'Auto-login: session restored');
    return user;
  } catch (e) {
    devLog('Auth', 'Auto-login check error', true);
    return null;
  }
}

function setAvatar(elId,photoUrl,initial){
  var el=document.getElementById(elId);
  if(!el)return;
  if(photoUrl){el.innerHTML='<img src="'+photoUrl+'" alt="">';el.classList.add('has-photo');}
  else{el.textContent=initial||'M';el.classList.remove('has-photo');}
}

// ─── AUTH: Login with phone via existing backend API ───
// Uses: POST /api/v1/users/auth/telegram-phone
function loginWithBackend(phone, telegramId, firstName, lastName, username, btn) {
  phone = String(phone).replace(/\s/g, '');
  if (!/^\+?[0-9]{10,15}$/.test(phone)) {
    toast('Invalid phone number', 'error');
    if (btn) onLoginError(btn);
    return;
  }

  var payload = {
    phone: phone,
    telegramId: String(telegramId || ''),
    username: username || '',
    firstName: firstName || 'User',
    lastName: lastName || ''
  };

  devLog('API check', 'auth/telegram-phone');

  bahiranApi('POST', '/api/v1/users/auth/telegram-phone', payload)
    .then(function(data) {
      var token = (data && data.token) || (data && data.data && data.data.token);
      var apiUser = (data && data.data && data.data.user) ||
                    (data && data.data && data.user) ||
                    (data && data.user) || null;

      if (token) {
        // Store token with 48h expiry
        var userObj = buildUserObj(apiUser, phone, telegramId, firstName, lastName, username);
        storeAuthSession(token, userObj);

        S.authToken = token;
        S.loggedIn = true;
        devLog('Auth', 'Login successful - token stored for 48h');
        onLoginSuccess(userObj, btn);
        return;
      }

      // Fallback: try telegram-token endpoint
      getTokenByTelegramId(telegramId, function(err, token2, apiUser2) {
        if (err) { onLoginError(btn); return; }
        var userObj2 = buildUserObj(apiUser2, phone, telegramId, firstName, lastName, username);
        storeAuthSession(token2, userObj2);
        S.authToken = token2;
        S.loggedIn = true;
        onLoginSuccess(userObj2, btn);
      });
    })
    .catch(function(err) {
      devLog('API error', 'telegram-phone — ' + (err && err.message ? err.message : String(err)), true);
      // Fallback: try telegram-token endpoint
      getTokenByTelegramId(telegramId, function(err2, token2, apiUser2) {
        if (err2) { onLoginError(btn); return; }
        var userObj2 = buildUserObj(apiUser2, phone, telegramId, firstName, lastName, username);
        storeAuthSession(token2, userObj2);
        S.authToken = token2;
        S.loggedIn = true;
        onLoginSuccess(userObj2, btn);
      });
    });
}

// ─── AUTH: Fallback - get token by telegramId ───
// Uses: POST /api/v1/users/auth/telegram-token
function getTokenByTelegramId(telegramId, cb) {
  devLog('API check', 'login (telegram-token)');
  var tid = telegramId != null && String(telegramId).trim() !== '' ?
            String(telegramId).trim() : DEFAULT_TELEGRAM_ID;

  bahiranApi('POST', '/api/v1/users/auth/telegram-token', { telegramId: tid })
    .then(function(data) {
      var token = (data && data.token) || (data && data.data && data.data.token);
      var apiUser = (data && data.data && data.data.user) ||
                    (data && data.data && data.user) ||
                    (data && data.user) || null;
      if (token) {
        cb(null, token, apiUser);
      } else {
        var msg = data && data.message ? data.message : 'No token in response';
        cb(new Error(msg));
      }
    })
    .catch(function(err) {
      devLog('API error', 'login — ' + (err && err.message ? err.message : String(err)), true);
      cb(err || new Error('Network error'));
    });
}

// ─── AUTH: Build user object from API response ───
function buildUserObj(apiUser, phone, telegramId, firstName, lastName, username) {
  if (apiUser) {
    return {
      name: [apiUser.firstName, apiUser.lastName].filter(Boolean).join(' ') || apiUser.username || 'User',
      phone: apiUser.phone || phone,
      telegramId: apiUser.telegramId != null ? String(apiUser.telegramId) : String(telegramId),
      username: apiUser.username || username || ''
    };
  }
  return {
    name: [firstName, lastName].filter(Boolean).join(' ') || 'User',
    phone: phone,
    telegramId: String(telegramId),
    username: username || ''
  };
}

// ─── AUTH: Login Success Handler ───
function onLoginSuccess(userObj, btn) {
  var city = S.user?.location || DEFAULT_CITY;
  var name = userObj.name || 'User';
  var initial = (name[0] || 'M').toUpperCase();

  S.user = {
    name: name,
    username: userObj.username || '',
    phone: userObj.phone || 'Not shared',
    location: city,
    initial: initial,
    telegramId: userObj.telegramId || '',
    photoUrl: ''
  };
  S.loggedIn = true;

  // Update UI
  setAvatar('h-av', S.user.photoUrl, S.user.initial);
  setAvatar('p-av', S.user.photoUrl, S.user.initial);

  var pName = document.getElementById('p-name');
  if (pName) pName.textContent = name;
  var pPhone = document.getElementById('p-phone');
  if (pPhone) pPhone.textContent = S.user.phone;
  var pTid = document.getElementById('p-telegram-id');
  if (pTid) pTid.textContent = 'Telegram ID: ' + (S.user.telegramId || '—');
  var pLoc = document.getElementById('p-loc');
  if (pLoc) pLoc.textContent = '📍 ' + city;
  var hCity = document.getElementById('h-city');
  if (hCity) hCity.textContent = city;

  renderHome();
  showScreen('home-screen');
  document.getElementById('ni-home').classList.add('active');

  if (btn) {
    btn.classList.remove('loading');
    document.getElementById('tg-btn-txt').textContent = 'Open Bahiran Delivery';
  }
  hideSpinner();
  updateLoginLocUI('found', city);
  toast('Welcome back! 👋', 'success');

  // Fetch latest user data from backend
  getMeAndUpdateUser();
}

// ─── AUTH: Main Login Entry Point ───
// Flow: User taps button → Telegram shows "Share Phone Number" sheet →
//        Contact data sent to backend → JWT stored with 48h expiry → Go to home
function doLogin() {
  var btn = document.getElementById('tg-btn');
  var tg = window.Telegram && window.Telegram.WebApp;

  // Get Telegram user info
  var tgUser = tg?.initDataUnsafe?.user || {};

  // Check if we have a phone in URL (opened from bot with ?phone= parameter)
  var phoneFromUrl = (function() {
    try {
      var params = new URLSearchParams(window.location.search);
      var p = params.get('phone') || params.get('tgWebAppStartParam');
      if (p && String(p).startsWith('phone_')) p = p.slice(6);
      return p || '';
    } catch (e) { return ''; }
  })();

  if (phoneFromUrl) {
    // Phone provided in URL (from bot deep link) — instant auto-login
    btn.classList.add('loading');
    document.getElementById('tg-btn-txt').textContent = 'Connecting…';
    showSpinner('Signing in…');
    updateLoginLocUI('detecting');

    loginWithBackend(
      phoneFromUrl,
      tgUser.id || DEFAULT_TELEGRAM_ID,
      tgUser.first_name || 'User',
      tgUser.last_name || '',
      tgUser.username || '',
      btn
    );

    try { window.history.replaceState({}, '', window.location.pathname); } catch (e) {}
    return;
  }

  // Auto-login using Telegram ID (works without phone share — for returning users after logout)
  if (tgUser.id) {
    btn.classList.add('loading');
    document.getElementById('tg-btn-txt').textContent = 'Signing in…';
    showSpinner('Signing in…');

    getTokenByTelegramId(tgUser.id, function(err, token, apiUser) {
      if (err) {
        // No account found by telegramId — fall through to phone share
        btn.classList.remove('loading');
        hideSpinner();
        document.getElementById('tg-btn-txt').textContent = 'Open Bahiran Delivery';
        showPhoneShareFlow(btn, tg, tgUser);
        return;
      }
      var userObj = buildUserObj(apiUser, '', tgUser.id, tgUser.first_name || 'User', tgUser.last_name || '', tgUser.username || '');
      storeAuthSession(token, userObj);
      S.authToken = token;
      S.loggedIn = true;
      onLoginSuccess(userObj, btn);
    });
    return;
  }

  // No Telegram ID — show phone share
  showPhoneShareFlow(btn, tg, tgUser);
}

// ─── AUTH: Phone share flow (shown when telegram-token login fails) ───
function showPhoneShareFlow(btn, tg, tgUser) {
  if (!tg || typeof tg.requestContact !== 'function') {
    toast('Open this app from Telegram and tap "Open Bahiran Delivery".', 'info');
    return;
  }

  btn.classList.add('loading');
  document.getElementById('tg-btn-txt').textContent = 'Waiting for permission…';
  showSpinner('Share your phone in the Telegram dialog…');

  var contactResolved = false;

  var onContact = function(ev) {
    if (contactResolved) return;
    var status = ev && ev.status;
    var phone = (ev && (ev.phone_number || (ev.contact && ev.contact.phone_number)))
                || (tg.initDataUnsafe?.user?.phone_number) || '';

    if (status === 'sent' && phone) {
      contactResolved = true;
      updateLoginLocUI('detecting');
      document.getElementById('tg-btn-txt').textContent = 'Signing in…';

      loginWithBackend(
        phone,
        tgUser.id || DEFAULT_TELEGRAM_ID,
        tgUser.first_name || 'User',
        tgUser.last_name || '',
        tgUser.username || '',
        btn
      );

      if (tg.offEvent) { try { tg.offEvent('contactRequested', onContact); } catch (e) {} }
      return;
    }

    if (status === 'sent' && !phone) {
      contactResolved = true;
      hideSpinner();
      btn.classList.remove('loading');
      document.getElementById('tg-btn-txt').textContent = 'Open Bahiran Delivery';
      toast('Phone received. Please try again.', 'info');
      if (tg.offEvent) { try { tg.offEvent('contactRequested', onContact); } catch (e) {} }
      return;
    }

    if (status === 'cancelled') {
      contactResolved = true;
      hideSpinner();
      btn.classList.remove('loading');
      document.getElementById('tg-btn-txt').textContent = 'Open Bahiran Delivery';
      toast('Share your phone to continue.', 'info');
      if (tg.offEvent) { try { tg.offEvent('contactRequested', onContact); } catch (e) {} }
    }
  };

  if (tg.onEvent) tg.onEvent('contactRequested', onContact);

  tg.requestContact(function(allowed) {
    if (!contactResolved && !allowed) {
      contactResolved = true;
      hideSpinner();
      btn.classList.remove('loading');
      document.getElementById('tg-btn-txt').textContent = 'Open Bahiran Delivery';
      toast('Share your phone to continue.', 'info');
      if (tg.offEvent) { try { tg.offEvent('contactRequested', onContact); } catch (e) {} }
    }
  });
}

// ─── AUTH: Login error handler ───
function onLoginError(btn) {
  if (btn) {
    btn.classList.remove('loading');
    document.getElementById('tg-btn-txt').textContent = 'Open Bahiran Delivery';
  }
  hideSpinner();
  updateLoginLocUI('denied');
  toast('Login failed. Try again.', 'error');
}

// ─── AUTH: Refresh user data from backend ───
function getMeAndUpdateUser() {
  devLog('API check','getMe');
  bahiranApi('POST','/api/v1/users/getMe').then(function(data){
    if(!data||!data.data){devLog('API check OK','getMe — no data');return;}
    var u=data.data.user||data.data;
    if(u.firstName||u.firstName===undefined)S.user.name=[u.firstName,u.lastName].filter(Boolean).join(' ')||S.user.name;
    if(u.phone)S.user.phone=u.phone;
    var pName=document.getElementById('p-name');if(pName)pName.textContent=S.user.name;
    var pPhone=document.getElementById('p-phone');if(pPhone)pPhone.textContent=S.user.phone;
    devLog('API check OK','getMe — user updated');
  }).catch(function(err){devLog('API error','getMe — '+(err&&err.message?err.message:String(err)),true);});
}

// ════ HOME ════
function renderHome(){renderOffers();fetchAndRenderRestaurants();}

function normalizeRestaurantFromApi(r){
  var id=r.id||r._id;
  if(id==null)return null;
  var locObj=r.location;
  var address='',locAm='';
  if(locObj&&typeof locObj==='object'){
    address=locObj.address||locObj.addressLine||'';
    locAm=locObj.addressAm||address||'';
  }
  if(!address)address=r.address||r.loc||r.location||'';
  if(typeof address!=='string')address=address&&address.address?address.address:String(address||'');
  if(!locAm)locAm=r.locAm||address||'';
  var imageCover=(r.imageCover||r.image||r.coverImage||r.cover);
  if(imageCover!=null&&typeof imageCover!=='string')imageCover=imageCover.url||imageCover.src||'';
  return{
    id:id,
    _id:r._id,
    emoji:typeof r.emoji==='string'?r.emoji:'🏪',
    name:typeof r.name==='string'?r.name:'Restaurant',
    nameAm:typeof r.nameAm==='string'?r.nameAm:(r.name||''),
    loc:typeof address==='string'?address:(address!=null?String(address):''),
    locAm:typeof locAm==='string'?locAm:(locAm!=null?String(locAm):''),
    location:locObj||null,
    rating:r.rating!=null?Number(r.rating):4,
    reviews:r.reviews!=null?Number(r.reviews):0,
    minTime:r.minTime!=null?Number(r.minTime):25,
    distKm:r.distKm!=null?Number(r.distKm):0,
    badge:typeof r.badge==='string'?r.badge:'',
    imageCover:typeof imageCover==='string'&&imageCover?imageCover:'',
    isOpenNow:r.isOpenNow===true,
    shortDescription:typeof r.shortDescription==='string'?r.shortDescription:(r.shortDesc||r.description||'')
  };
}
function fetchAndRenderRestaurants(){
  devLog('API check','restaurants');
  bahiranApi('GET','/api/v1/restaurants/?page=1&limit=50').then(function(data){
    var list=(data&&data.data&&(data.data.results||data.data))||(data&&data.results)||(Array.isArray(data)?data:[]);
    if(Array.isArray(list)&&list.length>0){
      D.restaurants=list.map(normalizeRestaurantFromApi).filter(Boolean);
      devLog('API check OK','restaurants — '+D.restaurants.length+' items');
      renderRestaurants();
    }else{devLog('API check OK','restaurants — empty, using fallback');renderRestaurants();}
  }).catch(function(err){devLog('API error','restaurants — '+(err&&err.message?err.message:String(err)),true);renderRestaurants();});
}

function normalizeMenuFromApi(apiMenu,restId,menuIdToCatIndex){
  var menus=apiMenu&&(apiMenu.menus||apiMenu.data&&apiMenu.data.menus)||[];
  var foods=apiMenu&&(apiMenu.foods||apiMenu.data&&apiMenu.data.foods)||[];
  if(!foods.length&&menus.length)menus.forEach(function(m){var f=m.foods||m.items||[];foods=foods.concat(f);});
  var items=foods.map(function(f,i){
    var id=f.id||f._id||('f'+i);
    var menuId=f.menuId&&(f.menuId._id||f.menuId);
    var catIdx=menuIdToCatIndex&&menuIdToCatIndex[menuId]!=null?menuIdToCatIndex[menuId]:0;
    var imageCover=f.imageCover||f.image||f.coverImage||f.cover||'';
    if(imageCover&&typeof imageCover!=='string')imageCover=imageCover.url||imageCover.src||'';
    return{
      id:id,
      n:f.foodName||f.name||f.n||'Item',
      nA:f.nameAm||f.foodName||f.name||'',
      d:f.description||f.d||'',
      p:f.price!=null?f.price:0,
      e:f.emoji||'🍽️',
      cat:catIdx,
      imageCover:typeof imageCover==='string'?imageCover:'',
      cookingTimeMinutes:f.cookingTimeMinutes!=null?Number(f.cookingTimeMinutes):null,
      rating:f.rating!=null?Number(f.rating):0,
      status:f.status||''
    };
  });
  return{cats:['All'],catsAm:['ሁሉም'],items:items};
}
function fetchFoodMenusForRestaurant(restId,cb){
  var id=restId&&(restId.id||restId._id||restId);
  if(!id){if(cb)cb(null,{});return;}
  var idStr=String(id);
  bahiranApi('GET','/api/v1/food-menus/restaurant/'+idStr).then(function(data){
    var list=(data&&data.data)||(Array.isArray(data)?data:[])||[];
    if(!Array.isArray(list))list=[];
    var cats=['All'];
    var catsAm=['ሁሉም'];
    var menuIdToCatIndex={};
    list.forEach(function(m){
      var restRef=m.restaurantId;
      var restIdMatch=restRef&&(String(restRef._id||restRef)===idStr);
      if(!restIdMatch)return;
      var mt=(m.menuType||'').trim();
      if(!mt)return;
      var idx=cats.length;
      cats.push(mt);
      catsAm.push(mt);
      menuIdToCatIndex[m._id]=idx;
    });
    if(cb)cb({cats:cats,catsAm:catsAm,menuIdToCatIndex:menuIdToCatIndex});
  }).catch(function(err){devLog('API error','food-menus — '+(err&&err.message?err.message:String(err)),true);if(cb)cb(null,{});});
}
function fetchRestaurantReviews(restaurantId,cb){
  var id=restaurantId&&(restaurantId.id||restaurantId._id||restaurantId);
  if(!id){if(cb)cb(null,null);return;}
  var idStr=String(id);
  bahiranApi('GET','/api/v1/restaurants/'+idStr+'/reviews').then(function(data){
    var list=(data&&data.data)||(Array.isArray(data)?data:[])||[];
    if(!Array.isArray(list))list=[];
    var total=list.length;
    var sum=0;
    list.forEach(function(r){var v=r.rating!=null?Number(r.rating):0;if(!isNaN(v))sum+=v;});
    var avg=total>0?sum/total:null;
    if(cb)cb(avg,total);
  }).catch(function(err){devLog('API error','reviews — '+(err&&err.message?err.message:String(err)),true);if(cb)cb(null,null);});
}
function fetchRestaurantMenuFromApi(restId,cb){
  var id=restId&&(restId.id||restId._id||restId);
  if(!id){devLog('API error','menu — no restaurant id',true);return cb(false);}
  var idStr=String(id);
  fetchFoodMenusForRestaurant(idStr,function(foodMenus){
    var cats=['All'],catsAm=['ሁሉም'],menuIdToCatIndex={};
    if(foodMenus&&foodMenus.cats){cats=foodMenus.cats;catsAm=foodMenus.catsAm||foodMenus.cats;menuIdToCatIndex=foodMenus.menuIdToCatIndex||{};}
    devLog('API check','menu restaurant '+idStr);
    bahiranApi('GET','/api/v1/restaurants/'+idStr+'/menu').then(function(data){
      var raw=(data&&data.data)||data;
      if(raw){
        var out=normalizeMenuFromApi(raw,restId,menuIdToCatIndex);
        out.cats=cats;
        out.catsAm=catsAm;
        D.menus[restId]=out;
        D.menus[idStr]=out;
        devLog('API check OK','menu — '+(out.items?out.items.length:0)+' items, '+(out.cats?out.cats.length:0)+' categories');
        cb(true);
      }else{devLog('API error','menu — empty response',true);D.menus[restId]={cats:cats,catsAm:catsAm,items:[]};cb(true);}
    }).catch(function(err){devLog('API error','menu — '+(err&&err.message?err.message:String(err)),true);D.menus[restId]={cats:cats,catsAm:catsAm,items:[]};cb(false);});
  });
}

// Home pull-to-refresh: config and animation (single source of truth)
const HOME_REFRESH = {
  message: 'Restaurants refreshed',
  footerDuration: 2200,
  animationDuration: 650,
  isRefreshing: false,
};
function refreshHomeWithAnimation(){
  if(HOME_REFRESH.isRefreshing)return;
  HOME_REFRESH.isRefreshing = true;
  renderOffers();
  fetchAndRenderRestaurants();
  // Trigger stagger animation on both sections
  const offersEl = document.getElementById('offers-scroll');
  const restEl   = document.getElementById('rest-grid');
  function triggerAnimation(el){
    if(!el) return;
    el.classList.remove('refresh-in');
    void el.offsetHeight;          // force reflow so animation restarts
    el.classList.add('refresh-in');
  }
  triggerAnimation(offersEl);
  triggerAnimation(restEl);
  // Cleanup animation classes after they finish
  setTimeout(()=>{
    offersEl && offersEl.classList.remove('refresh-in');
    restEl   && restEl.classList.remove('refresh-in');
    HOME_REFRESH.isRefreshing = false;
  }, HOME_REFRESH.animationDuration);
}

function renderOffers(){
  document.getElementById('offers-scroll').innerHTML=D.offers.map(function(o){
    var oid=String(o.id).replace(/"/g,'&quot;');
    return '<div class="offer-card" data-offer-id="'+oid+'" onclick="openOfferSheet(this.getAttribute(\'data-offer-id\'))">'+
      '<div class="oi"><div class="oi-inner">'+(o.emoji||'')+'<div class="oi-badge">-'+(o.disc||0)+'%</div></div></div>'+
      '<div class="ob"><div class="ob-name">'+(o.name||'')+'</div><div class="ob-row">'+
      '<div class="ob-prices"><div class="ob-new">ETB '+(o.price||0)+'</div><div class="ob-old">ETB '+(o.old||0)+'</div></div>'+
      '<button class="ob-add" data-offer-id="'+oid+'" onclick="event.stopPropagation();quickOfferAdd(this.getAttribute(\'data-offer-id\'))">+</button>'+
      '</div></div></div>';
  }).join('');
}

function renderRestaurants(){
  document.getElementById('rest-grid').innerHTML=D.restaurants.map(function(r){
    var rid=String(r.id!=null?r.id:r._id!=null?r._id:'');
    var locStr=String(S.lang==='am'?(r.locAm!=null?r.locAm:r.loc):(r.loc!=null?r.loc:r.locAm)||'');
    var locFirst=locStr.split?locStr.split(',')[0]:locStr;
    var safeId=(rid).replace(/"/g,'&quot;').replace(/</g,'&lt;');
    var imgHtml=r.imageCover?'<img src="'+r.imageCover.replace(/"/g,'&quot;').replace(/</g,'&lt;')+'" alt="">':'';
    var emojiHtml=r.imageCover?'':'<span class="rc-img-emoji">'+(r.emoji||'🏪')+'</span>';
    return `<div class="rest-card" data-rest-id="${safeId}" onclick="openRestaurant(this.getAttribute('data-rest-id'))">
      <div class="rc-img">
        ${imgHtml}
        ${emojiHtml}
        ${r.badge?'<div class="rc-badge">'+(r.badge)+'</div>':''}
      </div>
      <div class="rc-body">
        <div class="rc-name">${S.lang==='am'?(r.nameAm||r.name):(r.name||r.nameAm)}</div>
        <div class="rc-loc">📍 ${locFirst}</div>
        <div class="rc-chips">
          <div class="rc-chip">🕐 ${r.minTime}min</div>
          <div class="rc-chip">📍 ${r.distKm}km</div>
        </div>
        <div class="rc-foot">
          <div class="rc-stars">⭐ ${r.rating||0}</div>
          <div class="rc-rev">(${r.reviews||0})</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ════ OFFER DETAIL SHEET ════
function openOfferSheet(offerId){
  var id=offerId!=null?String(offerId):'';
  const o=D.offers.find(x=>String(x.id)===id);
  if(!o)return;
  S.sheetItem={id:o.id,name:o.name,price:o.price,emoji:o.emoji,restId:o.restId,restName:o.restName,old:o.old,disc:o.disc,desc:o.desc,isOffer:true};
  document.getElementById('sheet-hero').textContent=o.emoji;
  const disc=document.getElementById('sheet-disc');
  disc.textContent=`-${o.disc}% OFF`;disc.style.display='inline-block';
  document.getElementById('sheet-name').textContent=o.name;
  document.getElementById('sheet-rest').innerHTML=`<span>🏪</span><span>${o.restName}</span>`;
  document.getElementById('sheet-desc').textContent=o.desc;
  document.getElementById('sheet-pnew').textContent=`ETB ${o.price}`;
  const pold=document.getElementById('sheet-pold');
  pold.textContent=`ETB ${o.old}`;pold.style.display='block';
  document.getElementById('sheet-add-btn').textContent='Add to Cart — ETB '+o.price;
  document.getElementById('sheet-bd').classList.add('open');
  setTimeout(()=>document.getElementById('item-sheet').classList.add('open'),10);
}
function closeSheet(){
  document.getElementById('item-sheet').classList.remove('open');
  document.getElementById('sheet-bd').classList.remove('open');
}
function sheetAddToCart(){
  const item=S.sheetItem;if(!item)return;
  if(S.cart.length>0&&S.cart[0].restId!==item.restId){
    showConflict(S.cart[0].restId, item.restId, ()=>{
      closeSheet();
      S.cart.push({id:item.id,name:item.name,price:item.price,emoji:item.emoji,restId:item.restId,restName:item.restName,qty:1});
      updateBadge();updateVC();
      toast(`${item.name} added to cart 🛒`,'success');
      haptic();
    });
    return;
  }
  const ex=S.cart.find(c=>c.id===item.id);
  if(ex)ex.qty++;
  else S.cart.push({id:item.id,name:item.name,price:item.price,emoji:item.emoji,restId:item.restId,restName:item.restName,qty:1});
  updateBadge();updateVC();
  closeSheet();
  toast(`${item.name} added to cart 🛒`,'success');
  haptic();
}
function quickOfferAdd(offerId){
  var id=offerId!=null?String(offerId):'';
  const o=D.offers.find(x=>String(x.id)===id);if(!o)return;
  if(S.cart.length>0&&String(S.cart[0].restId)!==String(o.restId)){
    showConflict(S.cart[0].restId, o.restId, ()=>{
      S.cart.push({id:o.id,name:o.name,price:o.price,emoji:o.emoji,restId:o.restId,restName:o.restName,qty:1});
      updateBadge();updateVC();
      toast(`${o.name} added to cart 🛒`,'success');
      haptic();
    });
    return;
  }
  const ex=S.cart.find(c=>String(c.id)===String(o.id));
  if(ex)ex.qty++;
  else S.cart.push({id:o.id,name:o.name,price:o.price,emoji:o.emoji,restId:o.restId,restName:o.restName,qty:1});
  updateBadge();updateVC();
  toast(`${o.name} added to cart 🛒`,'success');
  haptic();
}

// ════ SEARCH ════
// ── SEARCH ──
function openDrop(){var inp=document.getElementById('h-search');if(inp){renderDrop(inp.value);}var sd=document.getElementById('s-drop');if(sd)sd.classList.add('open');}
function closeDrop(){var sd=document.getElementById('s-drop');if(sd){sd.classList.remove('open');}var inp=document.getElementById('h-search');if(inp)inp.value='';}
function onSearch(v){renderDrop(v);}

function openDishSheet(itemId, restId){
  closeDrop();
  document.getElementById('h-search').blur();
  // Navigate to restaurant with All tab, then scroll to + highlight the item
  S._highlightItemId = itemId;
  openRestaurant(restId);
}

function highlightItem(itemId){
  // Make sure All tab is active (show all items)
  const tabs = document.querySelectorAll('.rtab');
  if(tabs.length) { tabs.forEach(t=>t.classList.remove('active')); tabs[0].classList.add('active'); }
  if(S.currentRest) renderMenuItems(S.currentRest.id, 0);
  // Find row and scroll + flash
  setTimeout(()=>{
    var esc=String(itemId).replace(/\\/g,'\\\\').replace(/"/g,'\\"');
    const row = document.querySelector('.food-row[data-item-id="'+esc+'"]');
    if(!row) return;
    const screen = document.getElementById('rest-screen');
    // Scroll so item is visible with some top padding
    const rowTop = row.offsetTop;
    screen.scrollTo({top: rowTop - 160, behavior:'smooth'});
    setTimeout(()=>{
      row.classList.add('highlighted');
      setTimeout(()=>row.classList.remove('highlighted'), 1600);
    }, 350);
  }, 480);
}

function openRestFromSearch(restId){
  closeDrop();
  document.getElementById('h-search').blur();
  openRestaurant(restId);
}

function renderDrop(q){
  const dd=document.getElementById('s-drop');
  if(!dd)return;
  function restItem(r){
    var rid=String(r.id!=null?r.id:r._id).replace(/"/g,'&quot;');
    return '<div class="sd-item" data-rest-id="'+rid+'" onclick="openRestFromSearch(this.getAttribute(\'data-rest-id\'))"><div class="sd-thumb">'+(r.emoji||'')+'</div><div><div class="sd-nm">'+(r.name||'')+'</div><div class="sd-sb">⭐'+(r.rating||0)+' · '+(r.distKm||0)+'km</div></div><div class="sd-tag">Restaurant</div></div>';
  }
  function dishItem(d){
    var did=String(d.id).replace(/"/g,'&quot;');
    var rid=String(d.rid).replace(/"/g,'&quot;');
    return '<div class="sd-item" data-dish-id="'+did+'" data-dish-rid="'+rid+'" onclick="openDishSheet(this.getAttribute(\'data-dish-id\'),this.getAttribute(\'data-dish-rid\'))"><div class="sd-thumb">'+(d.e||'')+'</div><div><div class="sd-nm">'+(d.n||'')+'</div><div class="sd-sb">'+(d.rn||'')+' · ETB '+(d.p||0)+'</div></div><div class="sd-tag">ETB '+(d.p||0)+'</div></div>';
  }
  var query=(q!=null?String(q):'').trim();
  if(!query){
    dd.innerHTML='<div class="sd-sec"><div class="sd-ttl">Popular</div>'+D.restaurants.slice(0,4).map(restItem).join('')+'</div>';
    dd.classList.add('open');
    return;
  }
  var ql=query.toLowerCase();
  var rests=D.restaurants.filter(function(r){var n=(r.name||'').toLowerCase(),na=(r.nameAm||'');return n.indexOf(ql)!==-1||na.indexOf(query)!==-1;});
  var dishes=[];
  D.restaurants.forEach(function(r){
    var rid=String(r.id||r._id);
    var menu=D.menus[rid]||D.menus[r.id];
    var items=(menu&&menu.items)||[];
    items.forEach(function(i){var ni=(i.n||'').toLowerCase(),nia=(i.nA||'');if(ni.indexOf(ql)!==-1||nia.indexOf(query)!==-1)dishes.push({...i,rn:r.name,rid:r.id});});
  });
  if(!rests.length&&!dishes.length){dd.innerHTML='<div class="s-empty">No results for &quot;'+(query.replace(/</g,'&lt;'))+'&quot;</div>';dd.classList.add('open');return;}
  var h='';
  if(rests.length)h+='<div class="sd-sec"><div class="sd-ttl">Restaurants</div>'+rests.map(restItem).join('')+'</div>';
  if(dishes.length)h+='<div class="sd-sec"><div class="sd-ttl">Dishes</div>'+dishes.slice(0,5).map(dishItem).join('')+'</div>';
  dd.innerHTML=h;
  dd.classList.add('open');
}

// ════ RESTAURANT ════
function openRestaurant(restId){
  var ridStr=restId!=null?String(restId):'';
  var r=D.restaurants.find(function(x){return String(x.id||x._id)===ridStr;});
  if(!r)return;
  showSpinner('Loading menu…');
  S.currentRest=r;
  var heroImg=document.getElementById('rest-hero-img');
  var heroEmoji=document.getElementById('rh-emoji');
  if(r.imageCover){
    heroImg.src=r.imageCover;
    heroImg.style.display='block';
    if(heroEmoji)heroEmoji.style.display='none';
  }else{
    heroImg.src='';
    heroImg.style.display='none';
    if(heroEmoji){heroEmoji.style.display='';heroEmoji.textContent=r.emoji||'🏪';}
  }
  document.getElementById('ri-name').textContent=S.lang==='am'?(r.nameAm||r.name):r.name;
  document.getElementById('ri-loc').textContent=(S.lang==='am'?(r.locAm||r.loc):r.loc)||'—';
  function setRatingAndReviews(rating,reviews){
    var rv=rating!=null&&!isNaN(rating)?Number(rating).toFixed(1):'—';
    document.getElementById('ri-rating-val').textContent=rv;
    var revEl=document.getElementById('ri-rev');
    revEl.textContent=(reviews!=null&&reviews>0)?' ('+reviews+')':'';
    var distStr=(r.distKm!=null&&r.distKm!=='')?'📍 '+r.distKm+' km · ':'';
    var revStr=(reviews!=null&&reviews>0)?reviews+' reviews · ':'';
    document.getElementById('ri-meta').textContent=distStr+revStr+'🕐 '+(r.minTime!=null?r.minTime:25)+' min';
  }
  setRatingAndReviews(r.rating,r.reviews);
  fetchRestaurantReviews(ridStr,function(apiRating,apiReviews){
    if(apiRating!=null||apiReviews!=null)setRatingAndReviews(apiRating!=null?apiRating:r.rating,apiReviews!=null?apiReviews:r.reviews);
  });
  var openEl=document.getElementById('ri-open');
  var openTxt=document.getElementById('ri-open-txt');
  if(r.isOpenNow){
    openEl.classList.remove('closed');
    openTxt.textContent=S.lang==='am'?'ክፈት':'Open Now';
  }else{
    openEl.classList.add('closed');
    openTxt.textContent=S.lang==='am'?'ዝጋ':'Closed';
  }
  var shortEl=document.getElementById('ri-short-desc');
  var shortText=(r.shortDescription||'').replace(/\r\n/g,'\n').trim();
  shortEl.textContent=shortText||'';
  shortEl.style.display=shortText?'block':'none';
  document.getElementById('love-btn').textContent=S.loved[restId]?'❤️':'🤍';
  document.getElementById('love-btn').className='rh-btn'+(S.loved[restId]?' loved':'');
  document.getElementById('rh-si').value='';
  document.getElementById('menu-sec-ttl').textContent=S.lang==='am'?'ምግብ ዝርዝር':'Menu';
  var rid=r.id||r._id||restId;
  if(S.authToken){
    fetchRestaurantMenuFromApi(rid,function(ok){
      if(!ok&&!D.menus[rid])D.menus[rid]={cats:['All'],catsAm:['ሁሉም'],items:[]};
      renderRestTabs(rid,0);
      showScreen('rest-screen');
      updateVC();
      hideSpinner();
      if(S._highlightItemId){var hid=S._highlightItemId;S._highlightItemId=null;highlightItem(hid);}
    });
  }else{
    if(!D.menus[rid])D.menus[rid]={cats:['All'],catsAm:['ሁሉም'],items:[]};
    renderRestTabs(rid,0);
    showScreen('rest-screen');
    updateVC();
    hideSpinner();
    if(S._highlightItemId){var hid=S._highlightItemId;S._highlightItemId=null;highlightItem(hid);}
  }
}
function renderRestTabs(restId,ai){
  var m=D.menus[restId];
  if(!m||!m.items)m={cats:['All'],catsAm:['ሁሉም'],items:[]};
  var cats=S.lang==='am'?m.catsAm:m.cats;
  var safeRestId=String(restId).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  document.getElementById('rest-tabs').innerHTML=cats.map((c,i)=>`<div class="rtab ${i===ai?'active':''}" onclick="switchTab('${safeRestId}',${i},this)">${c}</div>`).join('');
  renderMenuItems(restId,ai);
}
function switchTab(restId,idx,el){
  document.querySelectorAll('.rtab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');renderMenuItems(restId,idx);
}
function renderMenuItems(restId,catIdx){
  var menu=D.menus[restId];
  var items=!menu||!menu.items?[]:(catIdx===0?menu.items:menu.items.filter(function(i){return i.cat===catIdx;}));
  document.getElementById('menu-list').innerHTML=items.map(item=>foodRow(item,restId)).join('')||`<div style="padding:28px;text-align:center;color:var(--mu);">No items here</div>`;
}
function foodRow(item,restId){
  const inCart=S.cart.find(c=>String(c.id)===String(item.id));
  const qty=inCart?inCart.qty:0;
  var safeRestId=String(restId).replace(/"/g,'&quot;');
  var safeItemId=String(item.id).replace(/"/g,'&quot;');
  var DEFAULT_FOOD_IMG='image/logo.png';
  var imgUrl=item.imageCover?(item.imageCover+'').replace(/"/g,'&quot;').replace(/</g,'&lt;'):DEFAULT_FOOD_IMG;
  var imgHtml='<img src="'+imgUrl+'" alt="">';
  var emojiHtml='';
  var metaParts=[];
  if(item.cookingTimeMinutes!=null)metaParts.push('🕐 '+(item.cookingTimeMinutes)+' min');
  if(item.rating!=null)metaParts.push('⭐ '+(item.rating));
  if(item.status)metaParts.push(item.status);
  var metaHtml=metaParts.length?'<div class="fr-meta">'+metaParts.join(' · ')+'</div>':'';
  return'<div class="food-row" data-rest-id="'+safeRestId+'" data-item-id="'+safeItemId+'">'+
    '<div class="fr-left">'+
      '<div class="fr-name">'+(S.lang==='am'?item.nA:item.n)+'</div>'+
      '<div class="fr-desc">'+(item.d||'')+'</div>'+
      '<div class="fr-price">ETB '+(item.p||0)+'</div>'+
      metaHtml+
    '</div>'+
    '<div class="fr-img">'+imgHtml+emojiHtml+
      (qty>0
        ?'<div class="fqc"><button class="fqb" data-rest-id="'+safeRestId+'" data-item-id="'+safeItemId+'" onclick="event.stopPropagation();mQty(this,-1)">−</button><div class="fqn">'+qty+'</div><button class="fqb" data-rest-id="'+safeRestId+'" data-item-id="'+safeItemId+'" onclick="event.stopPropagation();mQty(this,1)">+</button></div>'
        :'<button class="fadd" data-rest-id="'+safeRestId+'" data-item-id="'+safeItemId+'" onclick="event.stopPropagation();addItem(this)">+</button>')+
    '</div></div>';
}
function addItem(btn){
  var restId=btn.getAttribute('data-rest-id');
  var itemId=btn.getAttribute('data-item-id');
  if(!restId||!itemId)return;
  if(S.cart.length>0&&String(S.cart[0].restId)!==String(restId)){
    showConflict(S.cart[0].restId, restId, ()=>{
      const item=(D.menus[restId]&&D.menus[restId].items)?D.menus[restId].items.find(i=>String(i.id)===String(itemId)):null;
      const rest=D.restaurants.find(r=>String(r.id||r._id)===String(restId));
      if(!item||!rest)return;
      S.cart.push({id:item.id,name:item.n,price:item.p,emoji:item.e,restId,restName:rest.name,qty:1});
      updateBadge();updateVC();
      renderMenuItems(restId,getTabIdx());
      haptic();
    });
    return;
  }
  const item=D.menus[restId].items.find(i=>String(i.id)===String(itemId));
  const rest=D.restaurants.find(r=>String(r.id||r._id)===String(restId));
  if(!item||!rest)return;
  const ex=S.cart.find(c=>String(c.id)===String(itemId));
  if(ex)ex.qty++;
  else S.cart.push({id:item.id,name:item.n,price:item.p,emoji:item.e,restId,restName:rest.name,qty:1});
  updateBadge();updateVC();
  renderMenuItems(restId,getTabIdx());
  haptic();
}
function mQty(btn,delta){
  var restId=btn.getAttribute('data-rest-id');
  var itemId=btn.getAttribute('data-item-id');
  if(!restId||!itemId)return;
  const ci=S.cart.find(c=>String(c.id)===String(itemId));
  if(ci){ci.qty+=delta;if(ci.qty<=0)S.cart=S.cart.filter(c=>String(c.id)!==String(itemId));}
  updateBadge();updateVC();renderMenuItems(restId,getTabIdx());
}
function getTabIdx(){const a=document.querySelector('.rtab.active');if(!a)return 0;return[...document.querySelectorAll('.rtab')].indexOf(a);}
function filterMenu(v){
  if(!S.currentRest)return;
  var restId=S.currentRest.id||S.currentRest._id;
  var menu=D.menus[restId]||D.menus[String(restId)];
  if(!menu||!menu.items){return;}
  var items=menu.items;
  if(v&&String(v).trim()){var vl=String(v).toLowerCase().trim();items=items.filter(function(i){return (i.n||'').toLowerCase().indexOf(vl)!==-1||(i.nA||'').indexOf(v)!==-1;});}
  var listEl=document.getElementById('menu-list');
  if(listEl)listEl.innerHTML=items.length?items.map(function(item){return foodRow(item,restId);}).join(''):'<div style="padding:28px;text-align:center;color:var(--mu);">No items match your search.</div>';
}
function toggleLove(){
  if(!S.currentRest)return;
  S.loved[S.currentRest.id]=!S.loved[S.currentRest.id];
  document.getElementById('love-btn').textContent=S.loved[S.currentRest.id]?'❤️':'🤍';
  document.getElementById('love-btn').className='rh-btn'+(S.loved[S.currentRest.id]?' loved':'');
  toast(S.loved[S.currentRest.id]?'Added to favourites ❤️':'Removed from favourites','info');
}

// ════ CART ════
function updateBadge(){
  const t=S.cart.reduce((s,i)=>s+i.qty,0);
  const b=document.getElementById('cbadge');
  b.textContent=t>0?t:'';
  b.classList.toggle('on',t>0);
}
function updateVC(){
  const t=S.cart.reduce((s,i)=>s+i.qty,0);
  const p=S.cart.reduce((s,i)=>s+i.price*i.qty,0);
  // count bubble — hide when 0
  const vcn=document.getElementById('vc-n');
  vcn.textContent=t;
  vcn.style.display=t>0?'flex':'none';
  document.getElementById('vc-p').textContent=`ETB ${p}`;
  // show on home OR restaurant screen when cart has items
  const onAllowedScreen=['home-screen','rest-screen'].includes(S.currentScreen);
  document.getElementById('vc-sticky').classList.toggle('show',t>0&&onAllowedScreen);
}
function renderCart(){
  const el=document.getElementById('cart-content');
  if(!S.cart.length){
    el.innerHTML=`<div class="empty-cart"><div class="empty-ico">🛒</div><div class="empty-t">Cart is empty</div><div class="empty-s">Browse restaurants and add some delicious food!</div><button class="browse-btn" onclick="navTo('home-screen',document.getElementById('ni-home'))">Browse Restaurants</button></div>`;
    return;
  }
  const sub=S.cart.reduce((s,i)=>s+i.price*i.qty,0);
  const fee=30,total=sub+fee;
  var cartHtml='<div style="background:var(--wh);">'+S.cart.map(function(item){
    var safeId=String(item.id).replace(/"/g,'&quot;');
    return '<div class="cart-item" data-item-id="'+safeId+'">'+
      '<div class="ci-img">'+(item.emoji||'')+'</div>'+
      '<div class="ci-info"><div class="ci-name">'+(item.name||'')+'</div><div class="ci-rest">'+(item.restName||'')+'</div><div class="ci-price">ETB '+(item.price*item.qty)+'</div></div>'+
      '<div class="qty-ctrl">'+
      '<button class="qbtn" onclick="cQty(this,-1)">−</button><div class="qnum">'+item.qty+'</div><button class="qbtn" onclick="cQty(this,1)">+</button>'+
      '</div></div>';
  }).join('')+'</div>'+
    '<div class="addr-sec"><div class="addr-sec-t">📍 Deliver To</div><div class="addr-list">'+
    S.addresses.map(function(a){return '<div class="addr-opt '+(S.selAddr===a.id?'selected':'')+'" onclick="selCartAddr('+a.id+')"><div class="ao-ico">'+(a.icon||'')+'</div><div><div class="ao-nm">'+(a.label||'')+'</div><div class="ao-dt">'+(a.detail||'')+'</div></div><div class="ao-chk">✓</div></div>';}).join('')+
    '<div class="add-addr" onclick="openAddrModal()">➕ Add new address</div></div></div>'+
    '<div class="sum-card"><div class="sum-t">Order Summary</div>'+
    '<div class="sum-row"><span class="l">Subtotal</span><span>ETB '+sub+'</span></div>'+
    '<div class="sum-row"><span class="l">Delivery Fee</span><span>ETB '+fee+'</span></div>'+
    '<div class="sum-row total"><span>Total</span><span>ETB '+total+'</span></div>'+
    '<textarea class="note-inp" placeholder="Special instructions (optional)" rows="2"></textarea>'+
    '<button class="place-btn" onclick="openPaySheet('+total+')">Proceed to Payment</button></div>'+
    '<div style="height:18px;"></div>';
  el.innerHTML=cartHtml;
}
function cQty(btn,d){var row=btn.closest('.cart-item');if(!row)return;var id=row.getAttribute('data-item-id');if(id==null)return;var i=S.cart.find(c=>String(c.id)===String(id));if(i){i.qty+=d;if(i.qty<=0)S.cart=S.cart.filter(c=>String(c.id)!==String(id));}updateBadge();renderCart();}
function selCartAddr(id){S.selAddr=id;renderCart();}

// ════ PAYMENT SHEET ════
function openPaySheet(total){
  S.pendingOrder={total};
  document.getElementById('pay-amount').textContent=`ETB ${total}`;
  document.getElementById('pay-bd').classList.add('open');
  setTimeout(()=>document.getElementById('pay-sheet').classList.add('open'),10);
}
function closePaySheet(){
  document.getElementById('pay-sheet').classList.remove('open');
  document.getElementById('pay-bd').classList.remove('open');
}
function selectPayMethod(method){
  S.payMethod=method;
  document.querySelectorAll('.pay-method').forEach(function(m){m.classList.remove('selected');});
  var el=document.getElementById('pm-'+method);
  if(el)el.classList.add('selected');
}
function confirmPayment(){
  closePaySheet();
  if(!S.authToken){toast('Please log in to place an order','error');return;}
  if(!S.pendingOrder||!S.cart.length){toast('Add items to cart and try again.','info');return;}
  var restId=S.currentRest&&(S.currentRest.id||S.currentRest._id);
  if(!restId){toast('Something went wrong. Try again.','error');return;}
  renderChapaPage();
  showScreen('chapa-screen');
}
function renderChapaPage(){
  var total=S.pendingOrder&&S.pendingOrder.total!=null?S.pendingOrder.total:0;
  document.getElementById('chapa-amount').textContent='ETB '+total;
  var summary='';
  if(S.cart&&S.cart.length){summary=S.cart.map(function(i){return (i.name||'')+' × '+(i.qty||1);}).join(', ');}
  document.getElementById('chapa-summary').textContent=summary||'Order summary';
  document.getElementById('chapa-pay-btn').disabled=false;
}
function goBackFromChapa(){
  showScreen('cart-screen','back');
  renderCart();
}
function doChapaPayment(){
  if(!S.authToken){toast('Please log in to place an order','error');return;}
  var restId=S.currentRest&&(S.currentRest.id||S.currentRest._id);
  var addr=S.addresses.find(function(a){return a.id===S.selAddr;})||S.addresses[0];
  var addressStr=addr?(addr.detail||addr.address||addr.label):S.user.location||'Addis Ababa';
  if(!restId||!S.cart.length){toast('Cart is empty.','info');return;}
  var btn=document.getElementById('chapa-pay-btn');
  if(btn)btn.disabled=true;
  showSpinner('Processing payment…');
  var payload={
    restaurantId:restId,
    items:S.cart.map(function(i){return{foodId:i.id,quantity:i.qty,price:i.price};}),
    deliveryAddress:{address:addressStr,latitude:9.145,longitude:38.7636},
    paymentMethod:'chapa',
    phone:(S.user.phone||'').replace(/\s/g,'')
  };
  devLog('API check','place-order');
  bahiranApi('POST','/api/v1/orders/place-order',payload).then(function(data){
    var order=(data&&data.data)||data;
    var orderId=order&&(order.id||order._id||order.orderId);
    var orderTotal=order&&(order.total!=null?order.total:order.totalAmount);
    if(orderTotal==null)orderTotal=S.pendingOrder&&S.pendingOrder.total!=null?S.pendingOrder.total:0;
    var code=order&&order.confirmationCode?String(order.confirmationCode):'';
    S.confirmCode=code;
    var chapaPayload={
      amount:String(Math.round(Number(orderTotal)||0)),
      currency:'ETB',
      email:(S.user.email||'').trim()||'customer@bahiran.com',
      first_name:(S.user.firstName||S.user.first_name||'').trim()||'Customer',
      last_name:(S.user.lastName||S.user.last_name||'').trim()||'User',
      phone_number:(S.user.phone||'').replace(/\s/g,'')||'0900000000',
      tx_ref:'bahiran-'+(orderId||Date.now()),
      callback_url:'',
      return_url:typeof window!=='undefined'&&window.location&&window.location.origin?window.location.origin+'/':('https://t.me/'),
      customization:{title:'Bahiran Delivery',description:'Order payment'}
    };
    fetch('/api/chapa/initialize',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(chapaPayload)
    }).then(function(r){return r.json();}).then(function(chapaRes){
      hideSpinner();
      var checkoutUrl=chapaRes&&chapaRes.data&&chapaRes.data.checkout_url;
      if(checkoutUrl){
        S.cart=[];updateBadge();updateVC();
        toast('Opening Chapa… Complete payment in the opened page.','success',4000);
        showScreen('orders-screen');
        renderOrders();
        document.getElementById('ni-ord').classList.add('active');
        document.querySelectorAll('.ni').forEach(function(n){if(n!==document.getElementById('ni-ord'))n.classList.remove('active');});
        if(typeof Telegram!=='undefined'&&Telegram.WebApp&&Telegram.WebApp.openLink)Telegram.WebApp.openLink(checkoutUrl);
        else window.open(checkoutUrl,'_blank');
      } else {
        toast(chapaRes&&chapaRes.message?chapaRes.message:'Could not start Chapa payment.','error');
        if(btn)btn.disabled=false;
      }
    }).catch(function(err){
      hideSpinner();
      devLog('API error','chapa/initialize — '+(err&&err.message?err.message:String(err)),true);
      toast('Payment link failed. Try again.','error');
      if(btn)btn.disabled=false;
    });
  }).catch(function(err){
    hideSpinner();
    devLog('API error','place-order — '+(err&&err.message?err.message:String(err)),true);
    toast('Payment failed. Try again.','error');
    if(btn)btn.disabled=false;
  });
}

// ════ ORDERS (use token for GET my-orders when logged in) ════
var ordersListCache=[];
function renderOrders(){
  const listEl=document.getElementById('orders-list');
  const sm={
    delivered:['sp-d','✅ Delivered'],preparing:['sp-p','🍳 Preparing'],onway:['sp-o','🛵 On the Way'],
    finding:['sp-f','🔍 Finding Driver'],accepted:['sp-p','✅ Accepted'],pickup:['sp-o','📦 Picked Up'],
  };
  function render(orders){
    ordersListCache=orders||[];
    if(!ordersListCache.length){
      listEl.innerHTML='<div class="orders-empty" style="padding:40px 20px;text-align:center;color:var(--mu);"><div style="font-size:48px;margin-bottom:12px;">📦</div><div style="font-size:16px;font-weight:700;color:var(--tx);margin-bottom:6px;">No orders yet</div><div style="font-size:13px;">Place an order from a restaurant to see it here.</div></div>';
      return;
    }
    listEl.innerHTML=ordersListCache.map(function(o){
      var id=o.id||o._id||o.orderId||'#—';
      var idStr=String(id).replace(/"/g,'&quot;');
      var date=o.date||(o.createdAt?new Date(o.createdAt).toLocaleDateString():'');
      var rest=o.rest||o.restaurantName||(o.restaurant&&o.restaurant.name)||'';
      var items=o.items||(o.orderItems&&o.orderItems.map(function(i){return i.food?i.food.name+' × '+(i.quantity||1):'';}).join(', '))||'';
      var total=o.total!=null?o.total:(o.totalAmount!=null?o.totalAmount:0);
      var status=(o.status||'delivered').toLowerCase().replace(/\s/g,'');
      var statusStr=String(status).replace(/"/g,'&quot;');
      var cls=(sm[status]||sm.delivered)[0],lbl=(sm[status]||sm.delivered)[1];
      return '<div class="order-card" data-order-id="'+idStr+'" data-order-status="'+statusStr+'" onclick="openTracking(this)">'+
        '<div class="oc-top"><div><div class="oc-id">'+id+'</div><div class="oc-date">'+date+' · '+rest+'</div></div><div class="spill '+cls+'">'+lbl+'</div></div>'+
        '<div class="oc-items">'+items+'</div>'+
        '<div class="oc-btm"><div class="oc-total">ETB '+total+'</div><button class="reorder-btn" onclick="event.stopPropagation()">Reorder</button></div>'+
        '</div>';
    }).join('');
  }
  if(S.authToken){
    devLog('API check','my-orders');
    bahiranApi('GET','/api/v1/orders/my-orders').then(function(data){
      var orders=(data&&data.data)||(Array.isArray(data)?data:[]);
      if(Array.isArray(orders)&&orders.length>0){devLog('API check OK','my-orders — '+orders.length+' orders');render(orders);}
      else{devLog('API check OK','my-orders — empty');render([]);}
    }).catch(function(err){devLog('API error','my-orders — '+(err&&err.message?err.message:String(err)),true);render([]);});
  }else render([]);
}

// ════ TRACKING ════
function openTracking(el){
  var status,orderId;
  if(el&&el.getAttribute){
    status=el.getAttribute('data-order-status');
    orderId=el.getAttribute('data-order-id');
  }else{status=el;orderId=arguments[1];}
  renderTracking(status||'finding',S.confirmCode);
  showScreen('tracking-screen');
}
function renderTracking(status,code){
  const steps=[
    {k:'finding',  e:'🔍',t:'Finding Driver',   tm:'Just now'},
    {k:'accepted', e:'✅',t:'Driver Accepted',   tm:'~2 min'},
    {k:'pickup',   e:'📦',t:'Picked Up',         tm:'~15 min'},
    {k:'delivered',e:'🎉',t:'Delivered',         tm:'~30 min'},
  ];
  const ord=['finding','accepted','pickup','delivered'];
  // map legacy statuses
  const mapped={preparing:'finding',onway:'pickup'}[status]||status;
  const ci=Math.max(0,ord.indexOf(mapped));
  const isDelivered=mapped==='delivered';
  // show confirmation code box only when delivered
  const cb=document.getElementById('confirm-box');
  if(isDelivered&&code){
    cb.classList.add('show');
    document.getElementById('confirm-code').textContent=code||'7291';
  } else {
    cb.classList.remove('show');
  }
  document.getElementById('track-card').innerHTML=`
    <div class="trk-hdr"><div class="trk-id">#BHR-1055</div><div class="trk-eta">⏱️ ~${30-ci*8} min</div></div>
    ${steps.map((s,i)=>{
      const done=i<ci,active=i===ci;
      return`<div class="tstep">
        <div class="ts-l">
          <div class="ts-dot ${done?'td-done':active?'td-active':'td-pend'}">${done?'✅':s.e}</div>
          ${i<steps.length-1?`<div class="ts-line ${done?'tl-done':''}"></div>`:''}
        </div>
        <div class="ts-info">
          <div class="ts-ttl" style="color:${active?'var(--br)':done?'var(--ok)':'var(--mu)'}">${s.t}</div>
          <div class="ts-tm">${s.tm}</div>
        </div>
      </div>`;
    }).join('')}`;
}

// ════ ADDRESSES ════
const aIcons={home:'🏠',office:'🏢',other:'📍'};
function selType(btn){document.querySelectorAll('.atbtn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');S.selAddrType=btn.dataset.type;}
function openAddrModal(){document.getElementById('addr-modal').classList.add('show');}
function closeAddrModal(){document.getElementById('addr-modal').classList.remove('show');}
function saveAddr(){
  const label=document.getElementById('ai-label').value.trim()||S.selAddrType;
  const detail=document.getElementById('ai-detail').value.trim();
  if(!detail){toast('Please enter address details','error');return;}
  S.addresses.push({id:Date.now(),type:S.selAddrType,icon:aIcons[S.selAddrType]||'📍',label,detail});
  document.getElementById('ai-label').value='';
  document.getElementById('ai-detail').value='';
  closeAddrModal();
  toast('Address saved ✅','success');
}
document.getElementById('addr-modal').addEventListener('click',e=>{if(e.target===document.getElementById('addr-modal'))closeAddrModal();});

// ════ HELPERS ════
function haptic(){
  if(window.Telegram?.WebApp?.HapticFeedback)Telegram.WebApp.HapticFeedback.impactOccurred('light');
  else if(navigator.vibrate)navigator.vibrate(10);
}

// ════ PULL-TO-REFRESH (config-driven, single footer API) ════
const PTR = {
  pullThreshold: 36,
  screenSpinnerIds: { 'home-screen':'ptr-home','rest-screen':'ptr-rest','cart-screen':'ptr-cart','orders-screen':'ptr-orders','tracking-screen':'ptr-tracking','profile-screen':'ptr-profile' },
  footerTimeoutId: null,
};
function getPtrSpinner(screenId){
  const id = PTR.screenSpinnerIds[screenId];
  return id ? document.getElementById(id) : null;
}
function showRefreshFooter(message, durationMs){
  const foot = document.getElementById('refresh-footer');
  if(!foot)return;
  if(PTR.footerTimeoutId) clearTimeout(PTR.footerTimeoutId);
  foot.textContent = message;
  foot.classList.add('show');
  PTR.footerTimeoutId = setTimeout(()=>{
    foot.classList.remove('show');
    PTR.footerTimeoutId = null;
  }, durationMs);
}
function doRefresh(){
  const id = S.currentScreen;
  const ptrEl = getPtrSpinner(id);
  if(ptrEl) ptrEl.classList.remove('show');
  if(id === 'home-screen'){
    refreshHomeWithAnimation();
    showRefreshFooter(HOME_REFRESH.message, HOME_REFRESH.footerDuration);
    return;
  }
  if(id === 'rest-screen' && S.currentRest) openRestaurant(S.currentRest.id);
  else if(id === 'cart-screen') renderCart();
  else if(id === 'orders-screen') renderOrders();
  showRefreshFooter('Refreshed', 2000);
}
// ── Web Audio swipe sound — pre-unlocked AudioContext ──
let _audioCtx = null;
function getAudioCtx(){
  if(!_audioCtx || _audioCtx.state === 'closed'){
    try{ _audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return null; }
  }
  return _audioCtx;
}
// Unlock audio on first user touch (required by browsers)
document.addEventListener('touchstart', function unlockAudio(){
  const ctx = getAudioCtx();
  if(ctx && ctx.state === 'suspended') ctx.resume();
  document.removeEventListener('touchstart', unlockAudio);
}, { once: true, passive: true });

function playSwipeSound(){
  try{
    const ctx = getAudioCtx(); if(!ctx) return;
    if(ctx.state === 'suspended') ctx.resume();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(160, t + 0.2);
    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    osc.start(t);
    osc.stop(t + 0.25);
  }catch(e){}
}

function initPullToRefresh(scrollEl, screenId){
  if(!scrollEl)return;
  let startY = 0, startTop = 0, didPull = false, pulling = false, readySnapped = false;
  const THRESHOLD = PTR.pullThreshold;      // 36px — start showing arrow
  const READY_AT  = THRESHOLD * 2.2;       // ~79px — ready to release
  
  scrollEl.addEventListener('touchstart', function(e){
    startY    = e.touches[0].clientY;
    startTop  = scrollEl.scrollTop;
    didPull   = false;
    pulling   = false;
    readySnapped = false;
  }, { passive: true });

  scrollEl.addEventListener('touchmove', function(e){
    if(startTop > 2) return;
    const pull = e.touches[0].clientY - startY;
    if(pull < THRESHOLD) return;

    // Show arrow stage
    if(!pulling){
      pulling = true;
      const ptr = getPtrSpinner(screenId);
      if(ptr) ptr.classList.add('pulling');
    }

    // Rotate arrow based on pull progress toward READY_AT
    if(screenId === 'home-screen'){
      const progress = Math.min(pull / READY_AT, 1);          // 0 → 1
      const deg      = Math.round(progress * 180);             // 0° → 180° (↓ flips to ↑)
      const arrow    = document.getElementById('ptr-arrow');
      if(arrow) arrow.style.transform = `rotate(${deg}deg)`;
      
      // Snap to ready state once past threshold — haptic + visual
      if(pull >= READY_AT && !readySnapped){
        readySnapped = true;
        didPull = true;
        if(window.navigator?.vibrate) navigator.vibrate(12);
      }
    } else {
      // Non-home screens: just mark ready past threshold
      if(pull >= READY_AT) didPull = true;
    }
  }, { passive: true });

  scrollEl.addEventListener('touchend', function(){
    const ptr = getPtrSpinner(screenId);
    if(!ptr){ didPull = false; pulling = false; readySnapped = false; return; }
    
    if(didPull && pulling){
      // Transition: hide arrow, show spinner, play sound, do refresh
      ptr.classList.remove('pulling');
      ptr.classList.add('show');
      playSwipeSound();
      doRefresh();
    } else {
      // Not pulled far enough — retract
      ptr.classList.remove('pulling','show');
    }
    didPull = false; pulling = false; readySnapped = false;
  }, { passive: true });
}
// ─── AUTH: Logout ───
function doLogout() {
  clearAuthStorage();
  S.loggedIn = false;
  S.authToken = '';
  S.cart = [];
  S.user = { name: '', username: '', phone: '', location: DEFAULT_CITY, initial: 'M', telegramId: '', photoUrl: '' };
  updateBadge();
  showScreen('login-screen');
  toast('Logged out successfully', 'info');
}


// ════ CART CONFLICT MODAL ════
let _conflictCb = null;
function showConflict(curRestId, newRestId, onClear){
  const curRest = D.restaurants.find(r=>r.id===curRestId);
  const newRest = D.restaurants.find(r=>r.id===newRestId);
  document.getElementById('cm-cur-emoji').textContent = curRest ? curRest.emoji : '🍽️';
  document.getElementById('cm-cur-name').textContent = curRest ? curRest.name : 'Current';
  document.getElementById('cm-new-emoji').textContent = newRest ? newRest.emoji : '🍽️';
  document.getElementById('cm-new-name').textContent = newRest ? newRest.name : 'New';
  _conflictCb = onClear;
  document.getElementById('conflict-bd').classList.add('show');
}
function closeConflict(){
  document.getElementById('conflict-bd').classList.remove('show');
  _conflictCb = null;
}
// ─── AUTH: App Initialization with Auto-Login (48h session) ───
window.addEventListener('DOMContentLoaded', () => {
  // Check for valid stored session (48h window)
  var user = checkAutoLogin();

  if (user) {
    // AUTO-LOGIN: Restore session from localStorage
    devLog('Auth', 'Auto-login: Restoring session for ' + (user.name || 'user'));
    S.loggedIn = true;

    var name = user.name || 'User';
    var initial = (name[0] || 'M').toUpperCase();
    S.user = {
      name: name,
      username: user.username || '',
      phone: user.phone || 'Not shared',
      location: DEFAULT_CITY,
      initial: initial,
      telegramId: user.telegramId || '',
      photoUrl: ''
    };

    // Update UI
    setAvatar('h-av', S.user.photoUrl, S.user.initial);
    setAvatar('p-av', S.user.photoUrl, S.user.initial);

    var pName = document.getElementById('p-name');
    if (pName) pName.textContent = name;
    var pPhone = document.getElementById('p-phone');
    if (pPhone) pPhone.textContent = S.user.phone;
    var pTid = document.getElementById('p-telegram-id');
    if (pTid) pTid.textContent = 'Telegram ID: ' + (S.user.telegramId || '—');
    var pLoc = document.getElementById('p-loc');
    if (pLoc) pLoc.textContent = '📍 ' + S.user.location;
    var hCity = document.getElementById('h-city');
    if (hCity) hCity.textContent = S.user.location;

    renderHome();
    showScreen('home-screen');
    document.getElementById('ni-home').classList.add('active');

    // Refresh user data from backend
    getMeAndUpdateUser();
  } else {
    // No session — try auto-login methods
    var tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user || {};
    var autoLoggedIn = false;

    try {
      var params = new URLSearchParams(window.location.search);
      var p = params.get('phone') || params.get('tgWebAppStartParam');
      if (p && String(p).startsWith('phone_')) p = p.slice(6);
      if (p && /^\+?[0-9]{10,15}$/.test(String(p).replace(/\s/g, ''))) {
        // Phone from bot — auto-login silently, skip login screen entirely
        var phoneClean = String(p).replace(/\s/g, '');
        loginWithBackend(
          phoneClean,
          tgUser.id || DEFAULT_TELEGRAM_ID,
          tgUser.first_name || 'User',
          tgUser.last_name || '',
          tgUser.username || '',
          null
        );
        try { window.history.replaceState({}, '', window.location.pathname); } catch (e) {}
        autoLoggedIn = true;
      }
    } catch (e) {}

    if (!autoLoggedIn && tgUser.id) {
      // Try auto-login with Telegram ID (works after logout without phone share)
      getTokenByTelegramId(tgUser.id, function(err, token, apiUser) {
        if (err) {
          // No account found — show login screen, user can share phone from there
          return;
        }
        var userObj = buildUserObj(apiUser, '', tgUser.id, tgUser.first_name || 'User', tgUser.last_name || '', tgUser.username || '');
        storeAuthSession(token, userObj);
        S.authToken = token;
        S.loggedIn = true;
        onLoginSuccess(userObj, null);
      });
    }
  }

  // Setup conflict modal listeners
  const clearBtn = document.getElementById('cm-btn-clear');
  const bd = document.getElementById('conflict-bd');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (_conflictCb) { S.cart = []; updateBadge(); updateVC(); _conflictCb(); }
    closeConflict();
    toast('Cart cleared — new item added 🛒', 'info');
  });
  if (bd) bd.addEventListener('click', e => {
    if (e.target === bd) closeConflict();
  });
});

// ════ INIT ════
if(window.Telegram?.WebApp){Telegram.WebApp.ready();Telegram.WebApp.expand();}
detectLoc();
// Pull-to-refresh on all scroll screens
initPullToRefresh(document.getElementById('home-scroll'),'home-screen');
initPullToRefresh(document.getElementById('rest-screen'),'rest-screen');
initPullToRefresh(document.getElementById('cart-scroll'),'cart-screen');
initPullToRefresh(document.getElementById('orders-scroll'),'orders-screen');
initPullToRefresh(document.getElementById('tracking-scroll'),'tracking-screen');
initPullToRefresh(document.getElementById('profile-scroll'),'profile-screen');
// Vibration on all buttons / clickables
document.addEventListener('click',function(e){
  const t=e.target.closest('button, a, [onclick], .ni, .vc-bar, .offer-card, .rest-card, .sd-item, .food-row, .fadd, .fqb, .pay-method, .lang-btn, .loc-row, .prof-row, .logout-row, .rh-back, .rh-btn, .back-arr, .sheet-close, .ob-add, .cm-btn-clear, .cm-btn-cancel');
  if(t)haptic();
},{capture:true});
// Close search dropdown when tapping outside
document.addEventListener('mousedown',function(e){
  const drop=document.getElementById('s-drop');
  const inp=document.getElementById('h-search');
  if(!drop.contains(e.target)&&e.target!==inp){
    drop.classList.remove('open');
  }
});
document.addEventListener('touchstart',function(e){
  const drop=document.getElementById('s-drop');
  const inp=document.getElementById('h-search');
  if(!drop.contains(e.target)&&e.target!==inp){
    drop.classList.remove('open');
  }
},{passive:true});
</script>

<!-- ════ CART CONFLICT MODAL ════ -->
<div class="conflict-backdrop" id="conflict-bd">
  <div class="conflict-modal">
    <div class="cm-drag"></div>
    <div class="cm-body">
      <div class="cm-icon">⚠️</div>
      <div class="cm-title">Different Restaurant</div>
      <div class="cm-sub">Your cart already has items from another restaurant. Starting a new cart will remove your current items.</div>
      <div class="cm-rest-row">
        <div class="cm-rest-chip active">
          <span class="cm-rest-emoji" id="cm-cur-emoji">🍔</span>
          <span class="cm-rest-name" id="cm-cur-name">Current</span>
        </div>
        <div class="cm-arrow">→</div>
        <div class="cm-rest-chip">
          <span class="cm-rest-emoji" id="cm-new-emoji">🍕</span>
          <span class="cm-rest-name" id="cm-new-name">New</span>
        </div>
      </div>
      <div class="cm-btns">
        <button class="cm-btn-clear" id="cm-btn-clear">Clear Cart & Add New Item</button>
        <button class="cm-btn-cancel" onclick="closeConflict()">Keep Current Cart</button>
      </div>
    </div>
  </div>
</div>

</body>
</html>