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

const devConfig = `postgresql://${process.env.PG_USER}:${process.env.PG_PASSWORD}@${process.env.PG_HOST}:${process.env.DB_PORT}/${process.env.PG_DATABASE}`

const proConfig = process.env.DATABASE_URL


const pool = new Pool({
	connectionString: process.env.NODE_ENV === 'production' ? proConfig : devConfig
})




module.exports = pool