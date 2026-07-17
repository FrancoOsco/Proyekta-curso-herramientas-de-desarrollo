# Manual de uso de GitHub

## Repositorio
https://github.com/FrancoOsco/Proyekta-curso-herramientas-de-desarrollo.git

## Flujo de trabajo
1. Clonar el repositorio.
```bash
   git clone https://github.com/FrancoOsco/Proyekta-curso-herramientas-de-desarrollo.git
```

2. Cambiar a una rama o crear una nueva si es necesaria para una nueva funcionalidad.
```bash
   git checkout feature/prueba-alonso
   ```
   o
   ```bash
   git checkout -b nueva-rama
```

3. Realizar cambios en el proyecto.

4. Hacer commits.
```bash
   git add .
   git commit -m "..."
```

5. Subir los cambios (git push).
```bash
   git push origin nombre-rama
```

6. Crear un Pull Request para que se pueda verificar y aceptar la unión de ramas.

7. Fusionar los cambios a la rama principal.

## Estructura de ramas
- remotes/origin/backup-estable --> Rama de respaldo que almacena una versión estable.
- remotes/origin/feature/prueba-alonso --> Rama para realizar pruebas.
- remotes/origin/main --> Rama principal del proyecto.