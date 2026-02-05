# 🔰 Newbie Guide: Paano i-install ang Subscriber System?

Heto ang simplified steps para mapatakbo mo itong system sa computer mo, kahit hindi ka masyadong techy. Gagamit tayo ng **Docker** para isang click na lang (halos) ang installation.

---

## 🛠 Step 1: I-install ang Docker
Kailangan natin ng Docker para hindi mo na kailangang i-install isa-isa ang Database (MongoDB) at Node.js.

1.  Pumunta sa [Docker Desktop website](https://www.docker.com/products/docker-desktop/).
2.  I-download at i-install ang version para sa Windows o Mac.
3.  Pagkatapos ma-install, i-open ang Docker Desktop at siguraduhing "Running" ito (may green icon sa baba).

---

## 📂 Step 2: I-setup ang Files
1.  I-download ang folder ng project na ito.
2.  I-unzip o i-extract ito sa isang folder (halimbawa sa `Desktop`).

---

## 🚀 Step 3: Patakbuhin ang System
Ngayon, gagamitin na natin ang "Magic Command".

1.  Mag-open ng **Terminal** o **Command Prompt (CMD)**.
2.  Pumunta sa folder kung nasaan ang project. (Tip: Type `cd ` tapos i-drag mo yung folder sa terminal).
3.  I-type ang command na ito at i-press ang Enter:
    ```bash
    docker-compose up --build
    ```
4.  Maghintay lang ng ilang minuto. Dina-download nyan lahat ng kailangan (React, Node, Mongo). Kapag nakita mo nang may lumalabas na "Server running on port 5000", okay na yan!

---

## 🌐 Step 4: I-open sa Browser
1.  Buksan ang Google Chrome o kahit anong browser.
2.  I-type ito sa address bar: `http://localhost:3000`
3.  Makikita mo na ang **Login Screen**.

---

## 🔑 Step 5: Paano Mag-Login?
Gamit ang default "Admin" account na nilagay ko:

-   **Username**: `admin`
-   **Password**: `password123`

Pagka-login mo, makikita mo na yung listahan ng mga subscribers at yung dashboard.

---

## 📱 Paano i-install sa Cellphone? (PWA)
Dahil isa itong "PWA", pwede mo itong gawing parang app sa phone mo:

1.  Siguraduhing connected ang phone mo sa **parehong Wi-Fi** ng computer mo.
2.  Kunin ang "IP Address" ng computer mo (halimbawa `192.168.1.5`).
3.  Sa phone browser, i-open ang `http://192.168.1.5:3000`.
4.  Sa Chrome (Android), click mo yung 3 dots sa taas tapos "Add to Home Screen".
5.  Sa Safari (iPhone), click mo yung Share button tapos "Add to Home Screen".

---

## ⚠️ Tips para sa Newbie:
-   **Wag i-close yung terminal**: Kapag ni-close mo yung terminal (yung black window), mamamatay din yung system.
-   **Gusto mong itigil?**: I-press ang `Ctrl + C` sa terminal para i-stop ang system.
-   **Nawala ang data?**: Nilagay ko sa system na wag burahin ang data kahit i-restart mo ang computer. Safe ang payments mo!

Enjoy managing your subscribers! 🚀
