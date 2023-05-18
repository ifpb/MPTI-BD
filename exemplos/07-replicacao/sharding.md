# Configurando Sharding no Mongo

## 1. Primeiro, vamos configurar os replica sets para cada shard.

Para o Shard 1:

* Replica Set Name: "shard1"
* Membros:
    * shard1-1:27017 (Primary)
    * shard1-2:27017 (Secondary)
    * shard1-3:27017 (Secondary)

Para o Shard 2:

* Replica Set Name: "shard2"
* Membros:
    * shard2-1:27017 (Primary)
    * shard2-2:27017 (Secondary)
    * shard2-3:27017 (Secondary)

Agora, vamos iniciar os processos do MongoDB para cada membro de cada replica set. Você pode usar o Docker para facilitar essa configuração. Aqui estão os comandos para iniciar cada membro usando Docker:
Para o Shard 1:

```bash
docker network create shardnetwork
```

Membro 1 (Primary):
```bash
docker run -d -p 27017:27017 --network=shardnetwork --name shard1-1 mongo --replSet shard1 --shardsvr --port=27017
```

Membro 2 (Secondary):
```bash
docker run -d -p 27018:27017 --network=shardnetwork --name shard1-2 mongo --replSet shard1 --shardsvr --port=27017
```
Membro 3 (Secondary):
```bash
docker run -d -p 27019:27017 --network=shardnetwork --name shard1-3 mongo --replSet shard1 --shardsvr --port=27017
```

Para o Shard 2:

Membro 1 (Primary):
```bash
docker run -d -p 27020:27017 --network=shardnetwork --name shard2-1 mongo --replSet shard2 --shardsvr --port=27017
```
Membro 2 (Secondary):
```bash
docker run -d -p 27021:27017 --network=shardnetwork --name shard2-2 mongo --replSet shard2 --shardsvr --port=27017
```
Membro 3 (Secondary):
```bash
docker run -d -p 27022:27017 --network=shardnetwork --name shard2-3 mongo --replSet shard2 --shardsvr --port=27017
```


Agora, vamos configurar cada replica set para seus respectivos shards.

Para o Shard 1:

Conecte-se ao membro primário (shard1-1):
```bash
docker exec -it shard1-1 mongosh
```

Execute os comandos a seguir para iniciar a configuração do replica set e adicionar os membros:
```bash
rs.initiate({
    _id: "shard1",
    members: [
    { _id: 0, host: "shard1-1:27017" },
    { _id: 1, host: "shard1-2:27017" },
    { _id: 2, host: "shard1-3:27017" }
  ]
});

## Para adicionar shards posteriormente
#rs.add("shard1-2:27017")
#rs.add("shard1-3:27017")
```

Para o Shard 2:

Conecte-se ao membro primário (shard2-1):
```bash
docker exec -it shard2-1 mongosh
```

Execute os comandos a seguir para iniciar a configuração do replica set e adicionar os membros:
```bash
rs.initiate({
    _id: "shard2",
    members: [
    { _id: 0, host: "shard2-1:27017" },
    { _id: 1, host: "shard2-2:27017" },
    { _id: 2, host: "shard2-3:27017" }
  ]
  });
```

## 2. Criando os config servers
```bash
docker run -d --name configserver1 -p 27023:27017  --network=shardnetwork mongo mongod --configsvr --replSet configReplSet --port=27017 --bind_ip_all
docker run -d --name configserver2 -p 27024:27017  --network=shardnetwork mongo mongod --configsvr --replSet configReplSet --port=27017 --bind_ip_all
docker run -d --name configserver3 -p 27025:27017  --network=shardnetwork mongo mongod --configsvr --replSet configReplSet --port=27017 --bind_ip_all
```

Iniciando o replica set dos config servers:
```bash
docker exec -ti configserver1 mongosh 
rs.initiate({
    _id: "configReplSet",
    members: [
    { _id: 0, host: "configserver1:27017" },
    { _id: 1, host: "configserver2:27017" },
    { _id: 2, host: "configserver3:27017" }
  ]
  });
```

## 3. Criando o Roteador Mongo

Agora que os replica sets estão configurados para cada shard, vamos prosseguir com a configuração do roteador (mongos) para distribuir as operações entre os shards.

```bash
docker run -d -p 27027:27017 --name mongos --network=shardnetwork  mongo mongos --configdb configReplSet/configserver1:27017,configserver2:27017,configserver3:27017 --bind_ip_all
```

Adicionando os shards ao router:
```bash
# Acessando o servidor router
docker exec -ti mongos mongosh 

# Verificando o status atual (note que a coleção de shards está vazia)
sh.status();

# Adicionando shards
sh.addShard("shard1/shard1-1:27017,shard1-2:27017,shard1-3:27017")
sh.addShard("shard2/shard2-1:27017,shard2-2:27017,shard2-3:27017")

# Verificando o status atual (note que a coleção de shards agora está preenchida)
sh.status();
```

## 3. Criando uma collection com shard key range
```bash
docker exec -ti mongos mongosh

use MPTIBD
sh.enableSharding("MPTIBD")
db.createCollection("users")
db.users.createIndex({ age: 1 })
sh.shardCollection("MPTIBD.users", { "age": 1 }, false)
db.users.insertMany([
  { userId: 123, name: "John Doe", age: 30, city: "New York" },       
  { userId: 234, name: "Jane Smith", age: 25, city: "Los Angeles" },   
  { userId: 345, name: "Mike Johnson", age: 35, city: "Chicago" },     
  { userId: 456, name: "Emily Brown", age: 28, city: "San Francisco" },
  { userId: 567, name: "David Wilson", age: 32, city: "Houston" },     
  { userId: 678, name: "Sophia Taylor", age: 27, city: "Miami" },       
  { userId: 789, name: "Andrew Davis", age: 31, city: "Seattle" },      
  { userId: 890, name: "Olivia Thomas", age: 26, city: "Denver" },      
  { userId: 901, name: "James Robinson", age: 29, city: "Boston" },     
  { userId: 912, name: "Emma Garcia", age: 19, city: "Phoenix" }
]);

## Dividindo a coleção e distribuindo para múltiplos shards
sh.splitAt('MPTIBD.users', { age: 20 })
sh.splitAt('MPTIBD.users', { age: 30 })
sh.splitAt('MPTIBD.users', { age: 40 })
sh.moveChunk("MPTIBD.users", { age: 20 }, "shard1");

```

## 4. Criando uma collection com shard key hash

```bash
use MPTIBD
db.createCollection("products")
db.products.createIndex({ cliente: 1 })
sh.shardCollection("MPTIBD.products", { "cliente": "hashed" })
for (let i = 1; i <= 500; i++) {
  let userId = Math.floor(Math.random() * 1000) + 1; // Gerar um ID de usuário aleatório
  let product = {
    cliente: userId,
    name: "Product " + i,
    price: Math.floor(Math.random() * 100) + 1
  };
  db.products.insert(product);
}
```