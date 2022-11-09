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



```
