## Passo 1: Iniciar as instâncias do MongoDB


```bash

    docker network create mongonetwork

    # Iniciar o primeiro membro (Primary)
    docker run --name mongo1 -p 27017:27017 -d --network=mongonetwork mongo --replSet rs0 

    # Iniciar os membros Secondary
    docker run --name mongo2 -p 27018:27017 -d --network=mongonetwork mongo --replSet rs0
    docker run --name mongo3 -p 27019:27017 -d --network=mongonetwork mongo --replSet rs0

    # Iniciar o membro Hidden
    docker run --name mongo4 -p 27020:27017 -d  --network=mongonetwork mongo --replSet rs0

    # Iniciar o membro Arbitrário (Arbiter)
    docker run --name mongo5 -p 27021:27017 -d --network=mongonetwork mongo --replSet rs0
```

## Passo 2: Configurar o Replica Set

```bash
    # Conectar ao membro Primary
    docker exec -it mongo1 mongosh

    # No shell do MongoDB, executar os seguintes comandos:
    rs.initiate({
    _id: "rs0",
    members: [
        { _id: 0, host: "mongo1:27017", priority: 2 },
        { _id: 1, host: "mongo2:27017", priority: 1 },
        { _id: 2, host: "mongo3:27017", priority: 1 },
        { _id: 3, host: "mongo4:27017", priority: 0, hidden: true },
        { _id: 4, host: "mongo5:27017", arbiterOnly: true }
    ]
    })
```

## Passo 3: Inserir dados e monitorar o comportamento

```bash
    # Conectar ao membro Primary
    docker exec -it mongo1 mongosh

    # No shell do MongoDB, executar os seguintes comandos para inserir dados:
    use mydb
    db.mycollection.insertOne({ name: "Exemplo 1" });

    # Monitorar o comportamento dos membros Delay, Arbiter e dos secundários
    rs.status();

    # Conectar a um nó secondary
    docker exec -it mongo2 mongosh

    # Permitir find no nó secundário
    rs.secondaryOk();

    # Ler dados que foram replicados
    use mydb
    db.mycollection.find()

```

## Passo 4: Desligar o nó primário e invocar eleições

```bash
    # Conectar ao membro Primary
    docker exec -it mongo1 mongosh

    # No shell do MongoDB, executar o seguinte comando para desligar o nó primário:
    db.adminCommand({ shutdown: 1 })

    # Aguardar alguns segundos e verificar o resultado das eleições
    docker exec -it mongo2 mongosh
    rs.status()
```

## Passo 5: Ajustar a prioridade do membro replicaset e evitar que um secundário se torne primário

```bash
# Conectar ao membro Primary (que foi eleito após a queda do anterior)
docker exec -it mongo2 mongosh

# No shell do MongoDB, executar o seguinte comando para ajustar a prioridade do membro replicaset:
rs.reconfig({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017", priority: 0 },
    { _id: 1, host: "mongo2:27017", priority: 1 },
    { _id: 2, host: "mongo3:27017", priority: 2 },
    { _id: 3, host: "mongo4:27017", priority: 0, hidden: true },
    { _id: 4, host: "mongo5:27017", arbiterOnly: true }
]})

# Subir novamente o nó 1
docker start mongo1

# Desligar o nó 2 para fazer o 1 voltar a ser primário
docker exec -it mongo2 mongosh
db.adminCommand({ shutdown: 1 })

# Desligar o nó 1 novamente para disparar as elections
docker exec -it mongo1 mongosh
db.adminCommand({ shutdown: 1 })

# Observe que o primário será eleito para o 3 (maior prioridade)
docker exec -it mongo3 mongosh
rs.status()
```

## Passo 6: Configurar membros do replicaset sem direito a voto (non-voting)
```bash

# Iniciar o membro mongo6 (non-voting)
docker run --name mongo6 -p 27022:27017 -d --network=mongonetwork mongo --replSet rs0

# Iniciar o membro mongo7 (non-voting)
docker run --name mongo7 -p 27023:27017 -d --network=mongonetwork mongo --replSet rs0

# Conectar ao membro Primary
docker exec -it mongo3 mongosh

# No shell do MongoDB, executar o seguinte comando para adicionar membros non-voting ao replicaset:
rs.add({ host: "mongo6:27017", votes: 0, priority: 0 })
rs.add({ host: "mongo7:27017", votes: 0, priority: 0 })

# Para conferir os membros atualizados do replicaset:
rs.status()
```

Dessa forma, você criou um replicaset com 5 membros de diferentes tipos, inseriu dados e monitorou o comportamento dos membros Delay, Arbiter e dos secundários, desligou o nó primário e invocou eleições, ajustou a prioridade do membro do replicaset e configurou membros non-voting.