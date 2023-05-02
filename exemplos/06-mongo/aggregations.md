# Exemplos usando Aggregations no MongoDB

## Conjuntos de dados
* Séries
* Notícias


## 1. Agrupar resultados usando $group:
### a. Mostrar séries por nota
```js
    db.series.aggregate([{
        $group: {
            _id: {
                rating: "$rating"
            },
            count: { $sum: 1 },
            series: { $push: "$nome" }
        }
    }]);
```

### b. Mostrar média de rating das séries
```js
    db.series.aggregate([{
        $group: {
            _id: null,
            media: { $avg: "$rating" }
        }
    }]);
```
---

## 2. Usando $unwind
### a. Mostrar séries por gênero
```js
    db.series.aggregate([
        {
            $unwind: "$generos"
        },
        {
            $group: {
            _id: "$generos",
            count: { $sum: 1 },
            series: { $push: "$nome" }
        }
    }]);
```

### b. Obtendo todos os atores de todas as séries
```js
    db.series.aggregate([
        {
            $unwind: "$atores"
        },
        {
            $group: {
                _id: "$atores"
            }
        }
    ])
```
---

## 3. Filtrar usando $match
### a. Mostrar séries com nota maior que 4.7
```js
    db.series.aggregate([{
        $group: {
            _id: {
                rating: "$rating"
            },
            count: { $sum: 1 },
            series: { $push: "$nome" }
        }
    },
    {
        $match: {
            "_id.rating": { $gt: 4.7 }
        }
    }
    ])
```
###  b. Filtrar séries de drama
```js
    db.series.aggregate([
        {
            $unwind: "$generos"
        },
        {
            $group: {
            _id: "$generos",
            count: { $sum: 1 },
            series: { $push: "$nome" }
            }
        },
        {
            $match: {
                _id: "Drama"
            }
        }
    ])
```
### c. agrupar personagens de atores com participação em mais de uma série
```js
    db.series.aggregate([
        {
            $unwind: "$atores"
        },
        {
            $group: {
                _id: "$atores.nome",
                personagens: { $push: "$atores.personagem" }
            }
        },
        {
            $match: {
                $expr: { $gt: [{ $size: "$personagens" }, 1] }
            }
        },
        {
            $sort: {
                _id: 1
            }
        }
    ])
```
---
## 4. Usando $sort
### a. Mostrar séries por nota, em ordem decrescente
```js
    db.series.aggregate([
        {
            $group: {
                _id: {
                    rating: "$rating"
                },
                count: { $sum: 1 },
                series: { $push: "$nome" }
            }
        },
        {
            $sort: {
                "_id.rating": -1
            }
        }
    ])
```

### b. Mostrar séries por gênero, em ordem alfabética
```js
    db.series.aggregate([
        {
            $unwind: "$generos"
        },
        {
            $group: {
                _id: "$generos",
                count: { $sum: 1 },
                series: { $push: "$nome" }
            }
        },
        {
            $sort: {
                _id: 1
            }
        }
    ])
```
---
## 5. Transformar dados usando $project
### a. Retornar apenas nome e avaliação das séries de drama
```js
    db.series.aggregate([
        {
            $match: {
                "generos": { $in : ["Drama"]}
            }
        },
        {
            $project: {
                _id: 0,
                rating: 1,
                nome: 1
            }
        }
    ])
```
---

## 6. Juntando coleções usando $lookup
```js
    db.noticias.aggregate([
        {
            $lookup: {
                from: "series",
                localField: "serie",
                foreignField: "_id",
                as: "serie"
            }
        }
    ])
```
---

## 7. Usando $arrayElementAt
### a. Obter a referência de série numa notícia como objeto ao invés de lista, retornando apenas nome, rating e generos 
```js
    db.noticias.aggregate([
        {
            $lookup: {
                from: "series",
                localField: "serie",
                foreignField: "_id",
                as: "serie"
            }
        },
        {
            $addFields: {
                serie: { $arrayElemAt: ["$serie", 0]}
            }
        },
        {
            $project: {
                _id: 0,
                titulo: 1,
                link: 1,
                serie: {
                    nome: 1,
                    rating: 1,
                    generos: 1
                }
            }
        }
    ])
```