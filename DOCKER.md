# hot to test

```ruby
docker pull postgres:latest

# without data mount
docker run -itd -e POSTGRES_USER=vminds -e POSTGRES_PASSWORD=vminds -p 5432:5432 --name postgresql postgres

# with data mount
docker run -itd -e POSTGRES_USER=vminds -e POSTGRES_PASSWORD=vminds -p 5432:5432 -v /data:/var/lib/postgresql/data --name postgresql postgres


```

# pgAdmin

```ruby

docker pull dpage/pgadmin4:latest

docker run --name pgadmin-vminds -p 5051:80 -e "PGADMIN_DEFAULT_EMAIL=developers@volcanicminds.com" -e "PGADMIN_DEFAULT_PASSWORD=vminds" -d dpage/pgadmin4

# pgAdmin4: connect pgsql using correct IP read from inspect (retrieve your ID by docker ps)
docker ps -aqf "name=postgres" # retrieve popstgres container id
docker inspect a74dd3aeffc5 | grep IPAddress

# hint (retrieve all IPAddress)
docker ps -q | xargs -n 1 docker inspect --format '{{ .NetworkSettings.IPAddress }} {{ .Name }}'

```
