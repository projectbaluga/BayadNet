# 🗄️ Database Management Guide

Ang system na ito ay gumagamit ng **MongoDB**. Narito ang mga paraan kung paano mo pwedeng i-manage ang database.

---

## 1. Gamit ang MongoDB Compass (Pinaka-madali)
Kung gusto mo ng visual interface (parang Excel), i-download ang [MongoDB Compass](https://www.mongodb.com/try/download/compass).

1.  Buksan ang MongoDB Compass.
2.  I-paste ang connection string na ito:
    ```text
    mongodb://localhost:27017/internet_billing
    ```
3.  I-click ang **Connect**.
4.  Dito, pwede mo nang makita, i-edit, o i-delete ang mga documents sa `subscribers` at `users` collection.

---

## 2. Gamit ang Docker Terminal (Command Line)
Kung gusto mo namang mag-command line direct sa loob ng Docker container:

1.  I-open ang iyong Terminal/CMD.
2.  Pumasok sa loob ng Mongo container:
    ```bash
    docker exec -it $(docker ps -qf "name=mongo") mongosh
    ```
3.  Pag-pasok sa loob, piliin ang database:
    ```javascript
    use internet_billing
    ```
4.  **Common Commands:**
    -   Patingin ng lahat ng subscribers: `db.subscribers.find().pretty()`
    -   Bilangin ang subscribers: `db.subscribers.countDocuments()`
    -   I-reset ang payment status ng lahat: `db.subscribers.updateMany({}, {$set: {isPaidFeb2026: false}})`

---

## 3. Pag-Backup at Pag-Restore (Safe Keeping)
Mahalagang may backup ka ng data mo para hindi mawala ang records ng payments.

### **Mag-Backup:**
I-type ito sa iyong terminal (hindi sa loob ng mongosh):
```bash
docker exec $(docker ps -qf "name=mongo") mongodump --db internet_billing --out /data/db/backup
```
*Ang backup file ay mapupunta sa iyong `mongo-data` volume.*

### **Mag-Restore:**
```bash
docker exec $(docker ps -qf "name=mongo") mongorestore --db internet_billing /data/db/backup/internet_billing
```

---

## 4. Re-seeding the Data
Kung gusto mong ibalik sa "original state" ang listahan (halimbawa, nag-kamali ka ng delete):

1.  Patayin ang system: `Ctrl + C`
2.  Burahin ang existing data (Optional):
    ```bash
    docker-compose down -v
    ```
    *(Babala: Mabubura lahat ng records kasama ang login passwords)*
3.  Patakbuhin uli ang system:
    ```bash
    docker-compose up --build
    ```
    *Kusa itong mag-se-seed dahil wala itong makikitang records.*

---

## ⚠️ Paalala sa Seguridad:
-   Huwag i-expose ang port `27017` sa public internet nang walang password (auth).
-   Sa production environment, siguraduhing i-enable ang MongoDB Authentication.
