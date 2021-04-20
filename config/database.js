require('dotenv').config()
/*
const { Pool } = require('pg')
const pool = new Pool({
    user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: process.env.PGPORT,
	ssl: false
})
*/
const Pool = require('pg').Pool

const devConfig = new Pool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	port: process.env.DB_PORT,
	database: process.env.DB_DATABASE
  });

const proConfig = process.env.DATABASE_URL


/*const pool = new Pool({
	connectionString: process.env.NODE_ENV === 'production' ? proConfig : devConfig
})*/




module.exports = devConfig