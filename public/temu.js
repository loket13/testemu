// DOM shorthand code
const ide = function(e){return document.getElementById(e)};
const idv = function(e){return document.getElementById(e).value};
const idt = function(e){return document.getElementById(e).classList.toggle('hide')};
const idh = function(e){return document.getElementById(e).classList.add('hide')};
const ids = function(e){return document.getElementById(e).classList.remove('hide')};

const idR = function(e){return document.getElementById(e).classList.add('err')};
const idD = function(e){return document.getElementById(e).classList.remove('err')};

const pages = ['loginPage', 'userPage', 'adminPage'];
const usrParts = ['userLimited', 'userTemuBaru', 'userHome', 'userSetting'];
const admParts = ['adminHome', 'manageUsers', 'adminSetting'];
const charr = ['t', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's'];

function swPart(type, e, f){
    for (let i = 0; i < type.length; i++) {
        idh(type[i]);        
    };
    ids(e);
    if(f)(ids(f));
};


const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const hrzn = 'https://horizon-testnet.stellar.org';
const valSec = function(e){return StellarSdk.StrKey.isValidEd25519SecretSeed(e)};
const valPub = function(e){return StellarSdk.StrKey.isValidEd25519PublicKey(e)};

const aDb = 'GBS2AB7KINTUJZTAJAK422FPVT5DGBJAOPLKACGEONRBLHXYHFXKUCDA';
const dDb = 'GBLPNWVM4NBV4ENZW6FCONMMXDL7GMV523FH3FN5KEYIQ4GJMTRXU2OG';
const asc = 'temp';
const asi = 'GCOTVYVN6BQZ75CMFQUGFM2PDZI7FVCD3SORUKAMBR3WAQGOX5UCGJZT';

const defhour = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30'];

const defTema = [
    ["A","Pengelolaan Dokumen Pelaksanaan Anggaran"],
    ["B","Sertifikasi Bendahara"],
    ["C","UP/TUP"],
    ["D","Perencanaan Kas & RPD"],
    ["E","Penyelesaian Tagihan Kontraktual"],
    ["F","Data Kontrak dan Supplier"],
    ["G","Penolakan SPM"],
    ["H","Retur SP2D"],
    ["I","Revisi Anggaran"],
    ["J","LPJ Bendahara"],
    ["K","Rekonsiliasi dan Laporan Keuangan"]
];

async function setHour(pos){
    for (let i = 0; i < defhour.length; i++) {
        let o = document.createElement("option");
        o.setAttribute('value', defhour[i]);
        o.text = defhour[i];
        ide(pos).add(o);
    };
}
async function setTema(pos){
    for (let i = 0; i < defTema.length; i++) {
        let o = document.createElement("option");
        o.setAttribute('value', defTema[i][0]);
        o.text = defTema[i][0] +'. '+ defTema[i][1];
        ide(pos).add(o);
    };
};

// AES Encrypt & Decrypt Function //
async function encryptIt(str, pas){
    let enc = CryptoJS.AES.encrypt(str, pas);
    let res = enc.toString();
    return res;
};
async function decryptIt(enc, pas){
    try {
        let dec = CryptoJS.AES.decrypt(enc, pas);
        let res = dec.toString(CryptoJS.enc.Utf8);
        return res;
    } catch (err) {
        return 'err';
    }
};








async function getMemo(url){
    try {
        let tmp = await fetch(url);
        let dat = await tmp.json();
        let mmo = dat._embedded.records[0].memo;
        return mmo;
    } catch (err) {
        return 'err';        
    };
};

async function getTemu(pub){
    let url = hrzn+'/claimable_balances/?asset='+asc+':'+asi+'&claimant='+pub+'&limit=200';
    try {
        let raw = await fetch(url);
        let jsn = await raw.json();
        let rec = jsn._embedded.records;
        let temp = [];
        for (let i = 0; i < rec.length; i++) {
            let txr = rec[i]._links.transactions.href;
            let txl = txr.split('{?')[0];
            let mmo = await getMemo(txl);
            if(mmo === 'err'){
                //console.log('err');
            } else {
                let cc = rec[i].id;
                let mm = mmo.split('#');
                let dt = mm[0].slice(0,10);
                let tm = mm[0].slice(10,15);
                let ep = mm[1];
                let tt = mm[2];
                for (let i = 0; i < defTema.length; i++) {
                    if(defTema[i][0] === tt){
                        tp = defTema[i][1];
                    };
                };
                temp.push({dt, tm, ep, tt, tp, cc});
            };
        };
        temus = temp.sort((a, b) => a.ep - b.ep);
        return temus;
    } catch (err) {
        return 'err';
    };
};

async function getData(acc, str){
    let url = hrzn+'/accounts/'+acc+'/data/'+str;
    try {
        let raw = await fetch(url);
        let jsn = await raw.json();
        let val = window.atob(jsn.value);
        return val;
    } catch (err) {
        return 'err';
    }
};




ide('loginBtn').addEventListener("click", async function(){
    let acc = idv('inAcc');
    let pas = idv('inPas');
    let pub = await getData(aDb, acc);
    //console.log(pub);
    if(pub === 'err'){
        idR('inAcc');
    } else {
        idD('inAcc');
        let s1 = await getData(pub, 's1');
        let s2 = await getData(pub, 's2');
        if(s1 === 'err' || s2 === 'err'){
            idR('inPas');
        } else {
            let sec = await decryptIt(s1+s2, pas);
            let val = await valSec(sec);
            if(val === false){
                idR('inPas');
            } else {
                idD('inPas');
                let key = {pub, sec, acc, s1, s2};
                localStorage.setItem('temuKey', JSON.stringify(key, null, ''));
                //console.log(sec);
                window.location.href= './'
            }; 
        };
    };
});



async function loadUser(acc, pub, sec){
    //console.log(pub);
    let uac = hrzn+'/accounts/'+pub;
    try {
        let raw = await fetch(uac);
        let jsn = await raw.json();
        let blc = jsn.balances;
        for (let h = 0; h < blc.length; h++) {
            if(blc[h].asset_code === 'temp' && blc[h].asset_issuer === 'GCOTVYVN6BQZ75CMFQUGFM2PDZI7FVCD3SORUKAMBR3WAQGOX5UCGJZT'){              
                let bal = (+blc[h].balance).toFixed(0);
                ide('userData').setAttribute('data-acc', acc);
                ide('userData').setAttribute('data-pub', pub);
                ide('userData').setAttribute('data-sec', sec);
                ide('userData').setAttribute('data-bal', bal);
                ide('userData').innerHTML = acc + ' - [' + bal+'/5]';
            };         
        };
    } catch (error) {
        //console.log(err);
    };

    let tmu = await getTemu(pub);
    if(tmu === 'err'){
        console.log('error');
    } else {
        //console.log(tmu);
        for (let i = 0; i < tmu.length; i++) {
            let cb = document.createElement('card-box');
            cb.setAttribute('data-ccid', tmu[i].cc);
            cb.setAttribute('id', tmu[i].cc);
            cb.innerHTML = `
            <f-l >
                <h5>${i+1}</h5>
                <span>${tmu[i].dt}</span>
                <span>${tmu[i].tm}</span>
                <span>${tmu[i].tp}</span>
                <f-s></f-s>
                <i onclick='idt("${tmu[i].cc}opt")'>▼</i>
            </f-l>
            <div id='${tmu[i].cc}opt' class='hide'>
            <br>
                <f-l>
                    <f-s></f-s>
                    <button id=${tmu[i].cc}_cbtn onclick='usrCancel("${tmu[i].cc}", this)'>Batal</button>
                    <button id=${tmu[i].cc}_fbtn onclick='usrFinish("${tmu[i].cc}", this)'>Selesai</button>
                </f-l>
            </div>
            `;
            ide('userTemu').appendChild(cb);
        };
    };

};


async function loadAdmin(acc, pub, sec){
    ide('adminData').setAttribute('data-acc', acc);
    ide('adminData').setAttribute('data-pub', pub);
    ide('adminData').setAttribute('data-sec', sec);
    ide('adminData').innerHTML = acc;

    let tmu = await getTemu(dDb);
    if(tmu === 'err'){
        console.log('error');
    } else {
        console.log(tmu);
        for (let i = 0; i < tmu.length; i++) {
            let cb = document.createElement('card-box');
            cb.setAttribute('data-ccid', tmu[i].cc);
            cb.setAttribute('id', tmu[i].cc);
            cb.innerHTML = `
            <f-l >
                <h5>${i+1}</h5>
                <span>${tmu[i].dt}</span>
                <span>${tmu[i].tm}</span>
                <span>${tmu[i].tp}</span>
                <f-s></f-s>
                <i onclick='idt("${tmu[i].cc}opt")'>▼</i>
            </f-l>
            <div id='${tmu[i].cc}opt' class='hide'>
            <br>
                <f-l>
                    <f-s></f-s>
                    <button id=${tmu[i].cc}_cbtn onclick='admCancel("${tmu[i].cc}", this)'>Batal</button>
                    <button id=${tmu[i].cc}_fbtn onclick='admCancel("${tmu[i].cc}", this)'>Selesai</button>
                </f-l>
            </div>
            `;
            ide('adminTemu').appendChild(cb);
        };
    };

};

async function startUp(){
    let loc = localStorage.getItem('temuKey');
    if(loc === null){
        //console.log('no key.');
        ids('loginPage');
    } else {
        //console.log(loc);
        let key = JSON.parse(loc);
        if(key.acc === 'admin'){
            ids('adminPage');
            loadAdmin(key.acc, key.pub, key.sec);
        } else {
            ids('userPage');
            loadUser(key.acc, key.pub, key.sec);
        };
    };
};
startUp();



// DOM Functions
function goDark(){
    document.body.classList.toggle('dark');
};
function goHome(){
    window.location.href = '/';
};
ide('userLogoBtn').addEventListener("click", goHome);
ide('userDarkBtn').addEventListener("click", goDark);
ide('userHomeBtn').addEventListener("click", goHome);
ide('userSettingBtn').addEventListener("click", function(){
    swPart(usrParts, 'userSetting');
});
ide('userTemuBaruBtn').addEventListener("click", userTemuBaru);
ide('userTemuKirim').addEventListener("click", userTemuKirim);
ide('userTemuBatal').addEventListener("click", function(){
    swPart(usrParts, 'userTemuBaru');
});
ide('userGantiPas').addEventListener("click", userGantiPas);
ide('userBatalPas').addEventListener("click", function(){
    swPart(usrParts, 'userHome');
});
ide('userLogoutBtn').addEventListener("click", function(){
    localStorage.removeItem('temuKey');
    window.location.href = '/';
});

ide('admLogoBtn').addEventListener("click", goHome);
ide('admDarkBtn').addEventListener("click", goDark);
ide('admHomeBtn').addEventListener("click", goHome);
ide('admManUsrBtn').addEventListener("click", function(){
    swPart(admParts, 'manageUsers');
});
ide('admSettingBtn').addEventListener("click", function(){
    swPart(admParts, 'adminSetting');
});
ide('admLogoutBtn').addEventListener("click", function(){
    localStorage.removeItem('temuKey');
    window.location.href = '/';
});
// New Janji Function
async function userTemuBaru(){
    let bal = ide('userData').getAttribute('data-bal');
    //console.log(bal);
    if(bal > 0){
        let temus = await getTemu(dDb);
        if(temus === 'err'){
            //console.log('error, refreshing page');
            window.location.href = '/';
        } else {
            localStorage.setItem('temus', JSON.stringify(temus, null, ''));
            setHour('selHour');
            setTema('selTema');
        };
        swPart(usrParts, 'userTemuBaru');
    } else {
        swPart(usrParts, 'userLimited', 'userHome');
    }
};

async function disHour(dts, pos){
    let hrs = ide(pos).options;
    //console.log(hrs);
    for (let i = 0; i < hrs.length; i++) {
        if(dts.includes(hrs[i].value) == true){
            hrs[i].disabled = true;
            hrs[i].text = hrs[i].value + ' - tidak tersedia';
        } else {
            hrs[i].disabled = false;
            hrs[i].text = hrs[i].value;
        };
    };
};

async function chgDate(pos, pos2){
    let dt = idv(pos);
    let loc = localStorage.getItem('temus');
    let tms = JSON.parse(loc);
    let dts = [];
    for (let i = 0; i < tms.length; i++) {
        if(tms[i].dt === dt){
            dts.push(tms[i].tm);
        };
    };
    //console.log(dts);
    disHour(dts, pos2);
};

async function submitTx(pub, sec, ops, mmo){
    //console.log(pub, sec, ops, mmo);
    let acc = await server.loadAccount(pub);
    let sig = await StellarSdk.Keypair.fromSecret(sec);
    let nTx = new StellarSdk.TransactionBuilder(acc, {
        fee: '10000',
        networkPassphrase: StellarSdk.Networks.TESTNET,
    });
    nTx.addOperation(ops);
    nTx.addMemo(StellarSdk.Memo.text(mmo))
    nTx.setTimeout(180);

    let rTx = nTx.build();
    rTx.sign(sig);
    let res = await server.submitTransaction(rTx);
    if(res.successful == true){
        return 'success';
    } else {
        return 'failed';
    };
};

async function prepPostOps(pub, sec, mmo){
    let ops = StellarSdk.Operation.createClaimableBalance({
        asset: new StellarSdk.Asset(asc, asi),
        amount: '1',
        claimants: [
            new StellarSdk.Claimant(dDb),
            new StellarSdk.Claimant(pub)
        ]
    });
    let res = await submitTx(pub, sec, ops, mmo);
    if(res === 'success'){
        //console.log('tx success');
        ide('userTemuKirim').innerHTML = 'Terkirim';
        window.location.href = './';
    } else {
        ide('userTemuKirim').innerHTML = 'Gagal. Refresh dan Coba Lagi.';
    };
};

async function userTemuKirim(){
    let pub = ide('userData').getAttribute('data-pub');
    let sec = ide('userData').getAttribute('data-sec');

    let selDate = idv('selDate');
    let selHour = idv('selHour');
    let selTema = idv('selTema');
    if(selDate === ''){
        idR('selDate');
        return;
    } else {
        idD('selDate');
    };
    if(selHour === 'null'){
        idR('selHour');
        return;
    } else {
        idD('selHour');
    };
    if(selTema === 'null'){
        idR('selTema');
        return;
    } else {
        idD('selTema');
    };

    ide('userTemuBatal').setAttribute('disabled','');
    ide('userTemuKirim').setAttribute('disabled','');
    ide('userTemuKirim').innerHTML = 'Mengirim...';
    let newTime = selDate+selHour;
    //console.log(newTime);
    let tmpTime = new Date(selDate+' '+selHour);
    //console.log(tmpTime);
    let epoTime = tmpTime.getTime()/1000.0;
    //console.log(epoTime);
    let newMemo = newTime+'#'+epoTime+'#'+selTema;
    //console.log(newMemo);
    prepPostOps(pub, sec, newMemo);
};

// Close Janji Function
async function claimBalance(id, acct, mmo, src){
    let pub = ide(acct).getAttribute('data-pub');
    let sec = ide(acct).getAttribute('data-sec');
    let ops = StellarSdk.Operation.claimClaimableBalance({
        balanceId: id,
    });
    let acc = await server.loadAccount(pub);
    let sig = await StellarSdk.Keypair.fromSecret(sec);
    let nTx = new StellarSdk.TransactionBuilder(acc, {
        fee: '10000',
        networkPassphrase: StellarSdk.Networks.TESTNET,
    });
    nTx.addOperation(ops);
    nTx.addMemo(StellarSdk.Memo.text(mmo))
    nTx.setTimeout(180);

    let rTx = nTx.build();
    rTx.sign(sig);
    let res = await server.submitTransaction(rTx);
    //console.log(res);
    if(res.successful == true){
        return 'success';
    } else {
        return 'failed';
    };
};
async function usrCancel(id, src){
    ide(src.id).innerHTML = 'Mambatalkan...';
    let oBtn = src.id.split('_')[0]+'_fbtn';
    ide(oBtn).setAttribute('disabled', '');
    let sts = await claimBalance(id, 'userData', 'cancel');
    if(sts === 'success'){
        window.location.href = '/';
    } else {
        alert('Gagal membatalkan janji, klik OK untuk refresh halaman dan coba kembali.');
        window.location.href = '/';
    };
};
async function usrFinish(id, src){
    //console.log(src.id);
    ide(src.id).innerHTML = 'Menyelesaikan...';
    let oBtn = src.id.split('_')[0]+'_cbtn';
    //console.log(oBtn)
    ide(oBtn).setAttribute('disabled', '');
    
    let sts = await claimBalance(id, 'userData', 'finish');
    if(sts === 'success'){
        window.location.href = '/';
    } else {
        alert('Gagal menyelesaikan janji, klik OK untuk refresh halaman dan coba kembali.');
        window.location.href = '/';
    };
};

// Ganti Password Function
async function prepPostDta(pub, sec, dta){
    let op1 = StellarSdk.Operation.manageData({
        name: 's1',
        value: dta[0]
    });
    let op2 = StellarSdk.Operation.manageData({
        name: 's2',
        value: dta[1]
    });
    let acc = await server.loadAccount(pub);
    let sig = await StellarSdk.Keypair.fromSecret(sec);
    let nTx = new StellarSdk.TransactionBuilder(acc, {
        fee: '10000',
        networkPassphrase: StellarSdk.Networks.TESTNET,
    });
    nTx.addOperation(op1);
    nTx.addOperation(op2);
    nTx.setTimeout(180);

    let rTx = nTx.build();
    rTx.sign(sig);
    let res = await server.submitTransaction(rTx);
    //console.log(res);
    if(res.successful == true){
        //console.log('success');
        localStorage.removeItem('temuKey');
        window.location.href = '/';
        return 'success';
    } else {
        //console.log('failed');
        return 'failed';
    };
};
async function userGantiPas(){
    let loc = localStorage.getItem('temuKey');
    let tmp = JSON.parse(loc);
    let s1 = tmp.s1; let s2 = tmp.s2;
    let inOld = idv('inOld');
    let inNew = idv('inNew');
    let pub = ide('userData').getAttribute('data-pub');
    let sec = ide('userData').getAttribute('data-sec');
    let valOld = await decryptIt(s1+s2, inOld);
    if(valOld === sec){
        //console.log(valOld, sec);
        idD('inOld');
    } else {
        idR('inOld');
        return;
    };
    if(inNew === ''){
        idR('inNew');
        return;
    } else {
        let enc = await encryptIt(sec, inNew);
        //console.log(enc);
        let s1 = enc.slice(0,60);
        let s2 = enc.slice(60,120);
        let dta = [s1, s2];
        let sts = await prepPostDta(pub, sec, dta);
        if(sts === 'failed'){
            idR('userGantiPas');
            return; 
        };
    };
};



// Admin Function //
