function setCookie(cname: string, cvalue: string, exdays: number) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = `${cname}=${cvalue};${expires};path=/`;
}

function getCookie(cname: string): string {
    const name = cname + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function loadLastIframeSrc() {
    const lastSrc = getCookie("lastIframeSrc");
    if (lastSrc != "") {
        const iframe = document.getElementById("demosIframe") as HTMLIFrameElement;
        iframe.src = lastSrc;
    }
}

function linkClicked(event: Event, link: HTMLAnchorElement) {
    event.preventDefault();  // Prevent the default link behavior
    const iframe = document.getElementById("demosIframe") as HTMLIFrameElement;
    iframe.src = link.href;
    setCookie("lastIframeSrc", link.href, 7);
}

document.addEventListener("DOMContentLoaded", () => {
    loadLastIframeSrc();

    const links = document.querySelectorAll('.sidebar-item a');
    links.forEach(link => {
        link.addEventListener('click', (event) => {
            linkClicked(event, link as HTMLAnchorElement);
        });
    });
});
