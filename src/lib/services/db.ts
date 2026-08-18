// Este arquivo é executado exclusivamente no lado do servidor.
// Usamos imports dinâmicos para evitar que o empacotador do Vite inclua
// bibliotecas do Node.js (como mysql2 e dotenv) no bundle do navegador.

let pool: any = null;

export async function query<T>(sql: string, params?: unknown[]): Promise<T> {
  // Proteção: não executa no navegador
  if (typeof window !== "undefined") {
    return [] as unknown as T;
  }

  const mysql = await import("mysql2/promise");
  const dotenv = await import("dotenv");
  
  dotenv.config();

  if (!pool) {
    pool = mysql.createPool({
      host: process.env["DB_HOST"] || "127.0.0.1",
      port: Number(process.env["DB_PORT"]) || 3306,
      user: process.env["DB_USER"] || "root",
      password: process.env["DB_PASSWORD"] || "",
      database: process.env["DB_NAME"] || "public_performer",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  const [results] = await pool.execute(sql, params);
  return results as T;
}

export default {
  query,
};
