# Database COnfiguration

## 1. Install Necessary Libraries

### install sqlMOdel
    ```bash
        pip install sqlModel  apsycopg2
    ```
## 2. mapped the schema into python model
 --directly mapped the schema into db
## 3. connected the database to my code
    ```bash
        DATABSE_URL=postgresql://USERNAEM:PASSWORD@localhost:5432/DB_NAME
    ```
    -- Copy the database url in the .env file
    -- the connection code is found at utility/database/main.py line 4
## 4. testing the connection
    -- the test is found at test/database_connection_test.py. used pytest for testing

 