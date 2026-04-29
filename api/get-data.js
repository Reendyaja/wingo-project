let adminCookies = null;
const MASTER_ADMIN_ID = "2757283"; // UID Anda
const ADMIN_PHONE = "082363580990";
const ADMIN_PASS = "Ppkmu098";

export default async function handler(req, res) {
    const commonHeaders = { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36'
    };

    try {
        // 1. LOGIN OTOMATIS (Jika belum ada cookie admin)
        if (!adminCookies) {
            const loginRes = await fetch('https://luminastore.fun/api/webapi/login', {
                method: 'POST',
                headers: commonHeaders,
                body: `username=${ADMIN_PHONE}&pwd=${ADMIN_PASS}`
            });
            const loginData = await loginRes.json();
            if (loginData.status) adminCookies = loginRes.headers.get('set-cookie');
        }

        // 2. CEK IDENTITAS PENGUNJUNG (via GetUserInfo)
        const visitorCookie = req.headers.cookie || '';
        const userRes = await fetch('https://luminastore.fun/api/webapi/GetUserInfo', {
            headers: { 'Cookie': visitorCookie, ...commonHeaders }
        });
        const userData = await userRes.json();
        const visitorId = userData.data ? userData.data.id_user.toString() : null;

        // 3. AMBIL DAFTAR UNDANGAN ANDA (Izin Akses)
        const recordRes = await fetch('https://luminastore.fun/api/activity/invitation/record', {
            headers: { 'Cookie': adminCookies }
        });
        const recordJson = await recordRes.json();
        const allowedUIDs = recordJson.data ? recordJson.data.map(m => m.uid.toString()) : [];

        // 4. VALIDASI AKSES
        const isMaster = visitorId === MASTER_ADMIN_ID;
        const isInvited = allowedUIDs.includes(visitorId);

        if (!isMaster && !isInvited) {
            return res.status(403).json({
                status: false,
                type: "NOT_INVITED",
                visitorId: visitorId || "Belum Login"
            });
        }

        // 5. AMBIL DATA WINGO
        const wingoRes = await fetch('https://luminastore.fun/api/webapi/GetNoaverageEmerdList', {
            method: 'POST',
            headers: { ...commonHeaders, 'Cookie': adminCookies },
            body: 'typeid=1&pageno=0&pageto=10&language=vi'
        });
        const wingoData = await wingoRes.json();

        // Jika sesi admin mati, reset cache
        if (wingoData.status === false) adminCookies = null;

        res.status(200).json(wingoData);

    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
}
