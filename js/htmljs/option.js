$(document).ready(function () {
    option.start();

    setTimeout(() => {
        CheckGizli();
        BiziPuanla();
    }, 500);
});

//Puanla uyarısı
function BiziPuanla() {
    option.notfyMe(util.ceviri("bizi_puanla"), "puanla");
}
//Ext gizlilik kontrolü
function CheckGizli() {
    chrome.extension.isAllowedIncognitoAccess(donus => {
        if (donus) return false;
        option.notfyMe(util.ceviri("gizli_pencere"), "gizli");
    })
}

document.addEventListener("DOMContentLoaded", function () {
    util.htmlceviri();
    util.darkMode();
});

var uygulamaBaslik = util.ceviri("uygulama_baslik");

$(window).on("error", function () {
    //alert("error!");
});

//Switch Kontrol
$("input[type='checkbox']").on("click", function (e) {
    const localname = $(this).attr("local");
    option.switchSonuc(this.id, $(this).is(':checked')).then((resolve, reject) => {
        if (resolve === "true") {
            localStorage.setItem(localname, $(this).is(':checked'))
            util.darkMode();

            if (this.id === "password__recovery__switch" && $(this).is(':checked')) {
                var mail = localStorage.getItem("MainMail");
                if (mail == null || mail == "") {
                    $(".main__mail__btn").trigger("click");
                }
            }
        } else {
            event.preventDefault();
        }
    })
});

//Şifre Değiştirme
$(".change__pass__btn").on("click", donus => {
    event.preventDefault();
    option.checkinput().then(resolve => {
        if (resolve) {
            const oldInput = $("input[name=old-browser-pass]");
            const newInput = $("input[name=new-browser-pass]");
            const newaInput = $("input[name=new-again-browser-pass]");
            const oldPassHash = md5($(oldInput).val());
            util.StorageGet("user__pass").then(sonuc => {
                if (sonuc) {

                    if (oldPassHash === sonuc) {

                        if ($(newInput).val() === $(newaInput).val()) {

                            if ($(newInput).val() != $(oldInput).val()) {
                                const nesPassHash = md5($(newInput).val());
                                util.StorageSet("user__pass", nesPassHash).finally(() => {
                                    util.onaygonder(uygulamaBaslik, util.ceviri("sifre_degisti"));
                                });
                            } else {
                                option.Alert($(newInput));
                                util.uyarigonder(uygulamaBaslik, util.ceviri("eski_yeni_sifre_ayni"));
                            }

                        } else {
                            option.Alert($(newaInput));
                            util.uyarigonder(uygulamaBaslik, util.ceviri("yeni_sifre_eslesmedi"));
                        }

                    } else {
                        option.Alert($(oldInput));
                        util.uyarigonder(uygulamaBaslik, util.ceviri("sifre_yanlis"));
                    }
                } else {
                    util.TabiKapat();
                }
            })
        } else {
            event.preventDefault();
        }
    });
});
//İnput Odaklanma
$("input").on("focus", donus => {
    if ($(donus.target).parent().hasClass("alert")) {
        $(donus.target).parent().removeClass("alert");
    }
});
//Uyarı Gizleme
$(document).on('click', '.notifyjs-uyar-gizli', function () {
    chrome.tabs.query({}, tabs => {
        const tabara = tabs.find(tab => tab.url.indexOf('chrome://extensions') !== -1);
        if (tabara) {
            chrome.tabs.update(tabara.id, {
                url: 'chrome://extensions/?id=' + chrome.runtime.id,
                active: true
            });
        } else {
            chrome.tabs.create({
                url: 'chrome://extensions/?id=' + chrome.runtime.id
            });
        }
    });
});

$(document).on("click",".notifyjs-uyar-puanla", function () {
    chrome.tabs.create({
        url: 'https://www.patreon.com/humbldump'
    });
});
//Email Kontrolü
function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/* Ana Mail Kaydı */
$(".main__mail__btn").on("click", function (e) {
    option.mailKaydet().then((resolve,reject)=>{
        if (resolve == "true") {
            option.MailKontrol();
        }
        else{
            if (e.isTrigger != null) {
                $(this).trigger("click");
            }
        }
    })
});

class option {
    static start() {
        option.switchKontrol();
        option.notifyCSS();
        option.MailKontrol();
        util.StorageGet("user__pass").then(sonuc => {
            if (!sonuc) {
                option.girisyap();
            } else if (localStorage.FormLogin != "true") {
                option.LoginPass(sonuc);
            }
        });
    }

    static mailKaydet() {
        return new Promise((resolve, reject) => {
            const {
                PassRecovery,
                MainMail
            } = localStorage;
            if (MainMail) {
                var email = window.prompt(util.ceviri("eposta_adresin"), util.ceviri("epostani_gir"));
                var validate = validateEmail(email);
                if (validate) {
                    localStorage.setItem("MainMail", email);
                    alert(util.ceviri("eposta_kaydedildi"));
                    resolve("true");
                } else {
                    alert(util.ceviri("eposta_hatali"));
                    resolve("false");
                }
            } else {
                var email = window.prompt(util.ceviri("eposta_adresin"), util.ceviri("epostani_gir"));
                var validate = validateEmail(email);
                if (validate) {
                    localStorage.setItem("MainMail", email);
                    alert(util.ceviri("eposta_kaydedildi"));
                    resolve("true");
                } else {
                    alert(util.ceviri("eposta_hatali"));
                    resolve("false");
                }
            }
        });
    }

    static MailKontrol() {
        var mail = localStorage.getItem("MainMail");
        if (mail == null || mail == "") {
            $(".main__mail__btn").text(util.ceviri("eposta_kaydet"));
            $(".email__show_").parent().addClass("disabled");
        } else {
            $(".main__mail__btn").text(util.ceviri("eposta_degistir"));
            $(".email__show_").text(mail).parent().removeClass("disabled");
        }
    }
    static switchSonuc(elm, iliski) {
        return new Promise((resolve, reject) => {
            switch (elm) {
                //Kilit Ayarı
                case "browser__lock__switch":
                    if (iliski == true) {
                        util.onaygonder(uygulamaBaslik, util.ceviri("tarayici_kilit") + util.ceviri("acik") );
                    } else {
                        util.onaygonder(uygulamaBaslik, util.ceviri("tarayici_kilit") + util.ceviri("kapali") );
                    }
                    break;
                    //Karanlık Mod Ayarı
                case "dark__mode__switch":
                    if (iliski == true) {
                        util.onaygonder(uygulamaBaslik, util.ceviri("karanlik_mod") + util.ceviri("acik") );
                    } else {
                        util.onaygonder(uygulamaBaslik, util.ceviri("karanlik_mod") + util.ceviri("kapali") );
                    }
                    break;
                    //Şifre Sıfırlama Ayarı
                case "password__recovery__switch":
                    if (iliski == true) {
                        util.onaygonder(uygulamaBaslik, util.ceviri("sifremi_unuttum") + util.ceviri("acik") );
                    } else {
                        util.onaygonder(uygulamaBaslik, util.ceviri("sifremi_unuttum") + util.ceviri("kapali") );
                    }
                    break;
                    //Derin Güvenlik Ayarı
                case "password__attempt__switch":
                    if (iliski == true) {
                        util.onaygonder(uygulamaBaslik, util.ceviri("derin_guvenlik") + util.ceviri("acik") );
                    } else {
                        util.onaygonder(uygulamaBaslik, util.ceviri("derin_guvenlik") + util.ceviri("kapali") );
                    }
                    break;
                    //Geçmiş Temizleme Ayarı
                case "clear__history__switch":
                    if (localStorage.getItem('WrongAttempt') != "true") {
                        util.uyarigonder(uygulamaBaslik, util.ceviri("derin_guvenlik") + util.ceviri("kapali") );
                        resolve("false");
                    } else {
                        if (iliski == true) {
                            util.onaygonder(uygulamaBaslik, util.ceviri("gecmisi_temizle") + util.ceviri("acik") );
                        } else {
                            util.onaygonder(uygulamaBaslik, util.ceviri("gecmisi_temizle") + util.ceviri("kapali") );
                        }
                    }
                    break;
                default:
                    resolve("false");
                    break;
            }
            resolve("true");
        });
    }

    static switchKontrol() {
        $("input[type='checkbox']").each((index, elm) => {
            if ($(elm).attr('id') === "password__recovery__switch") {
                var mail = localStorage.getItem("MainMail");
                if (mail == null || mail == "") {
                    const ayar = false;
                    $(elm).prop("checked", ayar);
                    return false;
                }
            }
            const localname = $(elm).attr("local");
            const ayar = localStorage.getItem(localname) === 'true';
            $(elm).prop("checked", ayar);
        });

    }

    static notfyMe(text = "Error!", className = "hata") {
        $.notify(text, {
            style: 'uyar',
            autoHide: false,
            className: className
        });
    }

    static notifyCSS() {
        $.notify.addStyle('uyar', {
            html: '<div><div class="notfy__class"><div class="notify__ic"><div class="notify__icon"><i class="fa fa-exclamation"></i></div><div class="notfiy__text"><span data-notify-text></span></div></div></div></div>',
        });
    }

    static LoginPass(pass = null) {
        if (pass) {
            $.confirm({
                title: util.ceviri("oturum_ac_buton"),
                content: 'url:loginform.html',
                type: 'blue',
                theme: 'lock-noti',
                boxWidth: '30%',
                useBootstrap: false,
                draggable: false,
                onContentReady: function () {
                    util.htmlceviri();
                },
                buttons: {
                    save: {
                        text: 'Login in',
                        btnClass: 'btn-blue',
                        keys: ['enter'],
                        action: function () {
                            var Sifre = this.$content.find('input#login__pass');
                            const SifreHash = md5(Sifre.val());
                            try {
                                if (!Sifre.val()) throw util.ceviri('sifre_gir_uyari');
                                if (SifreHash != pass) throw util.ceviri('sifre_yanlis');


                                localStorage.setItem('FormLogin', 'true');
                                return true;
                            } catch (error) {
                                alert(error);
                                $(Sifre).focus().val("");
                                return false;
                            }
                        }
                    }
                }
            })
        }
    }

    static checkinput() {
        return new Promise(resolve => {
            var hata = true;
            $("input[type=password]").each(function (index, element) {
                if ($(this).val().length < 5) {
                    $(this).parent().addClass('alert');
                    hata = false;
                }
            });
            resolve(hata);
        });
    }

    static Alert(element = null) {
        if ($(element).hasClass("validate-area")) {
            $(element).addClass("alert").focus().val("");
        } else if ($(element).parent().hasClass("validate-area")) {
            $(element).parent().addClass("alert").focus().val("");
        } else {
            console.log("Hata");
        }
    };


    static checkAlert() {
        if ($("validate-area").hasClass("alert")) {
            return false;
        } else {
            return true;
        }
    }


    static LockKapa() {
        return new Promise(resolve => {
            $.confirm({
                title: uygulamaBaslik,
                content: util.ceviri("tarayici_kilit_ac"),
                icon: 'fa fa-info-circle',
                type: 'orange',
                theme: 'lock-noti',
                boxWidth: '30%',
                useBootstrap: false,
                draggable: false,
                buttons: {
                    yes: {
                        text: util.ceviri("evet_btn"),
                        action: function () {
                            resolve(true);
                        }
                    },
                    no: {
                        text: util.ceviri("hayir_btn"),
                        action: function () {
                            resolve(true);
                        }
                    }
                }
            });
        });
    }

    static girisyap() {
        $.confirm({
            title: util.ceviri("ana_sifre_olustur"),
            content: 'url:form.html',
            type: 'blue',
            theme: 'lock-noti',
            boxWidth: '30%',
            useBootstrap: false,
            draggable: false,
            onContentReady: function () {
                util.htmlceviri();
            },
            buttons: {
                save: {
                    text: util.ceviri("kaydet_buton"),
                    btnClass: 'btn-blue',
                    keys: ['enter'],
                    action: function () {
                        var Sifre = this.$content.find('input#first__pass');
                        var Sifret = this.$content.find('input#first__pass__again');
                        if (Sifre.val().length >= 5 && Sifre.val().length <= 25) {

                            if (Sifre.val() === Sifret.val()) {
                                try {
                                    util.StorageSet("user__pass", md5(Sifre.val()))
                                        .then(() => {
                                            localStorage.setItem('KilitAcik', 'true');
                                            localStorage.setItem('Kilitli', 'false');
                                            localStorage.setItem("vucbug", "false");
                                            $("#browser__lock__switch").prop("checked", true);
                                            alert(util.ceviri("ana_sifre_olusturuldu"));
                                            return true;
                                        }).finally(() => {
                                            chrome.runtime.reload();
                                        });
                                } catch (error) {
                                    alert(util.ceviri("ana_sifre_kaydedilmedi"));
                                    console.log(error);
                                    util.TabiKapat();
                                }
                            } else {
                                alert(util.ceviri("yeni_sifre_eslesmedi"));
                                $(Sifret).focus();
                                return false;
                            }

                        } else {
                            alert(util.ceviri("sifre_uzunluk_kontrol"));
                            $(Sifre).focus();
                            return false;
                        }
                    }
                }
            }
        });
    }


}