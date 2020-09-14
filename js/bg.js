class BrowserLock {
    
    static start() {
        util.localduzen()
            .then(() => {
                BrowserLock.__onInstalled();
                BrowserLock.ContextOlustur();
                BrowserLock.UnistalURL();
                if (localStorage.KilitAcik === "true") {
                    setTimeout(() => {
                        BrowserLock.Lock()
                    }, 1500);
                    BrowserLock.__onTabCreate();
                    BrowserLock.__onWindowClose();
                    BrowserLock.__onWindowsCreate();
                } else {
                    notification.sifreuyar();
                }
            })
            .catch(err => {
                console.log(err);
            });

    }

    static UnistalURL() {
        const url = "https://docs.google.com/forms/d/e/1FAIpQLSfHgB_RKR1ZRR8e9pHQuEo6s58NMc-DwP4BvgX-gf1Ji7Kp2g/viewform";
        chrome.runtime.setUninstallURL(url);
    }
    //Tarayıcıyı Kilitle
    static Lock() {
        try {
            util.StorageSet("kilit__giris", "true").then(resolve => {
                const {
                    KilitAcik,
                    KilitEkran,
                    Kilitli
                } = localStorage;
                if (KilitAcik === "true") {
                    if (KilitEkran != "true" && Kilitli != "false") {
                        chrome.windows.getAll({
                            populate: true
                        }, Pencere => {
                            if (Pencere.length > 0) {
                                localStorage.KayitliPencereler = JSON.stringify(Pencere);
                                BrowserLock.GirisEkrani().then(() => util._removeOpenWindows());
                            }
                        });
                    }
                }
            });
        } catch (error) {
            console.log(error);
        }
    }




    static GirisEkrani() {
        return new Promise(resolve => {

            const width = 640;
            const height = 540;
            const left = parseInt((screen.width / 2) - (width / 2));
            const top = parseInt((screen.height / 2) - (height / 2));

            const GirisBilgileri = {
                left,
                top,
                width,
                height,
                focused: true,
                incognito: false,
                type: 'panel',
                url: 'html/login.html?wndid=hmbldmplgscrn',
            };

            localStorage.ilkekran = "false";
            localStorage.ekranolusum = "true";
            chrome.windows.create(GirisBilgileri, windowLogin => {
                localStorage.EkranID = windowLogin.id;
                localStorage.KilitEkran = "true";
                localStorage.removeItem("ekranolusum")
                resolve();
            });
        });
    }

    static ContextOlustur() {
        chrome.contextMenus.removeAll();
        chrome.contextMenus.create({
            title: util.ceviri("tarayici_kilitle"),
            onclick: util.yenidenKilit.bind(this),
            contexts: ['all'],
        });
        chrome.contextMenus.create({
            title: util.ceviri("ayarlari_degistir"),
            onclick: util.ContextTiklama.bind(this),
            contexts: ['all'],
        });
    }

    static __onTabCreate() {
        try {
            chrome.tabs.onCreated.addListener(function (donuss) {
                const lgscrin = chrome.runtime.getURL("html/login.html?wndid=hmbldmplgscrn");
                if (donuss.pendingUrl === lgscrin || donuss.url.indexOf("?wndid=hmbldmplgscrn") === lgscrin) {
                    console.log("login screen opened");
                } else {
                    const {
                        Kilitli,
                        KilitEkran,
                        EkranID
                    } = localStorage;
                    util.StorageGet("kilit__giris").then(donus => {
                        if (donuss) {
                            if (Kilitli != "false") {
                                if (KilitEkran != "false" || donus === "true") {
                                    chrome.tabs.remove(donuss.id, then => {
                                        chrome.windows.remove(donuss.windowId);
                                    })
                                    if (KilitEkran === "true") {
                                        util.WndwFocus(EkranID);
                                    }
                                }
                            }
                        }
                    });
                }
            });
        } catch (error) {
            alert(error);
        }
    }


    static __onWindowsCreate() {
        chrome.windows.onCreated.addListener(donus => {
            const {
                KilitAcik,
                Kilitli,
                KilitEkran,
                ilkekran
            } = localStorage;
            if (KilitAcik === "true") {

                if (Kilitli != "false") {
                    //Kilitle
                    if (KilitEkran != "true" && ilkekran != "false") {
                        localStorage.ilkekran = "false";
                        setTimeout(() => {
                            BrowserLock.Lock()
                        }, 1500);
                    } else if (KilitEkran === "true") {
                        chrome.windows.get(donus.id, (sonuc) => {
                            chrome.windows.remove(donus.id);
                        })
                    }
                }
            }
        })
    }

    static __onWindowClose() {
        chrome.windows.onRemoved.addListener(donus => {
            const {
                EkranID
            } = localStorage;
            var sa = Number(EkranID);
            if (donus === sa) {
                localStorage.kalanhak = 3;
                localStorage.KilitEkran = "false";
                localStorage.KayitliPencereler = JSON.stringify([]);
                util.StorageGet("kilit__giris").then(donusum => {
                    if (donusum === "true") {
                        chrome.windows.getAll(resolve => {
                            for (const winsd of resolve) {
                                chrome.windows.remove(winsd.id)
                            }
                        });
                    }
                });
                util.StorageRemove("kilit__giris")
            }

            chrome.windows.getAll(wins => {
                if (wins.length === 0) localStorage.ilkekran = 'true';
            });
        });
    }

    static __onInstalled() {
        chrome.runtime.onInstalled.addListener(detay => {
            const {
                reason
            } = detay;
            const suanversion = chrome.runtime.getManifest().version;
            if (reason === "update") {
                //alert("sorry for v1.0.3 bug, for fixed that new update gonna remove your password and lock! its not gonna happen every update");
            } else if (reason == 'install') {
                notification.yuklendi(suanversion);
            }
        })
    }
}