# Configuración de PostgreSQL para Carancho

## ✅ Contenedor PostgreSQL Levantado

El contenedor de PostgreSQL ya está corriendo y listo para ser usado.

## 📊 Información de Conexión

### Credenciales
- **Usuario:** `postgres`
- **Contraseña:** `postgres`
- **Base de datos:** `carancho`
- **Host (desde fuera del contenedor):** `localhost`
- **Host (desde otro contenedor Docker):** `postgres`
- **Puerto externo:** `5433` (mapeado al puerto interno 5432)
- **Puerto interno:** `5432`

### Cadena de Conexión (DATABASE_URL)

Para usar desde tu aplicación, agrega esta línea a tu archivo `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/carancho
```

O si tu aplicación corre dentro de Docker:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/carancho
```

## 🐳 Comandos Docker Útiles

### Ver el estado del contenedor
```bash
docker compose ps postgres
```

### Ver los logs de PostgreSQL
```bash
docker compose logs postgres
docker compose logs -f postgres  # Para seguir los logs en tiempo real
```

### Detener el contenedor
```bash
docker compose stop postgres
```

### Iniciar el contenedor
```bash
docker compose start postgres
```

### Reiniciar el contenedor
```bash
docker compose restart postgres
```

### Eliminar el contenedor y el volumen (⚠️ ELIMINA TODOS LOS DATOS)
```bash
docker compose down postgres
docker volume rm carancho_pgdata
```

## 🔧 Comandos de PostgreSQL

### Conectarse a la base de datos
```bash
docker compose exec -T postgres psql -U postgres -d carancho
```

### Ejecutar comandos SQL directamente
```bash
# Listar todas las bases de datos
docker compose exec -T postgres psql -U postgres -d carancho -c "\l"

# Listar todas las tablas
docker compose exec -T postgres psql -U postgres -d carancho -c "\dt"

# Ejecutar una consulta personalizada
docker compose exec -T postgres psql -U postgres -d carancho -c "SELECT * FROM tu_tabla;"
```

### Hacer backup de la base de datos
```bash
docker compose exec -T postgres pg_dump -U postgres carancho > backup.sql
```

### Restaurar un backup
```bash
docker compose exec -T postgres psql -U postgres -d carancho < backup.sql
```

## 📝 Configuración de Payload CMS

Tu proyecto ya tiene instalado el adaptador de PostgreSQL (`@payloadcms/db-postgres`). 

Asegúrate de que tu archivo de configuración de Payload use el adaptador correcto. Típicamente en `src/payload.config.ts`:

```typescript
import { postgresAdapter } from '@payloadcms/db-postgres'

export default buildConfig({
  // ... otras configuraciones
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),
  // ... más configuraciones
})
```

## 🚀 Próximos Pasos

1. Actualiza tu archivo `.env` con la cadena de conexión de PostgreSQL
2. Verifica que tu `payload.config.ts` esté usando el adaptador de PostgreSQL
3. Ejecuta las migraciones si es necesario: `yarn payload migrate`
4. Inicia tu aplicación: `yarn dev`

## ⚙️ Versión de PostgreSQL

Actualmente usando: **PostgreSQL 16.13**

Si necesitas cambiar la versión, modifica la línea `image: postgres:16` en el archivo `docker-compose.yml`.

## 📌 Nota sobre el Puerto

El puerto externo se configuró en **5433** porque el puerto **5432** ya estaba en uso en tu sistema. Si alguna vez liberas el puerto 5432 y quieres usarlo, puedes cambiar la línea en `docker-compose.yml`:

```yaml
ports:
  - '5432:5432'  # en lugar de '5433:5432'
```
