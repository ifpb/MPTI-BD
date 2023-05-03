# Exemplos usando Aggregations no MongoDB

## Conjuntos de dados
* Séries
* Notícias


## 1. Agrupar resultados usando $group:
### a. Mostrar séries por nota (exibir nome da série e a nota de cada uma)
<details><summary>Resposta</summary>

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
</details>

### b. Mostrar rating (nota) média de todas as séries cadastradas
<details><summary>Resposta</summary>

```js
    db.series.aggregate([{
        $group: {
            _id: null,
            media: { $avg: "$rating" }
        }
    }]);
```
</details>
---

## 2. Usando $group juntamente com $unwind
### a. Mostrar todos os gêneros cadastrados e séries correspondentes
<details><summary>Resposta</summary>

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
</details>

### b. Listar nomes e personagens de todos os atores das séries cadastradas
<details><summary>Resposta</summary>

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
</details>
---

## 3. Filtrando resultados usando $match
### a. Mostrar séries por notas e exibir apenas as com nota maior que 4.7
<details><summary>Resposta</summary>

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
</details>

###  b. Mostrar apenas as séries do gênero drama
<details><summary>Resposta</summary>

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
</details>

### c. Mostrar nomes dos personagens de atores com participação em mais de uma série
<details><summary>Resposta</summary>

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
</details>

---
## 4. Usando $sort
### a. Mostrar séries por nota, em ordem decrescente
<details><summary>Resposta</summary>

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
</details>

### b. Mostrar lista de gêneros e cada série associada, em ordem alfabética
<details><summary>Resposta</summary>

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
</details>

---
## 5. Transformando retorno usando projeção ($project)
### a. Retornar apenas nome e avaliação das séries de drama
<details><summary>Resposta</summary>

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
</details>
---

## 6. Juntando coleções usando $lookup
### a. Exibir todas as notícias e os dados das séries associadas a cada notícia
<details><summary>Resposta</summary>

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
</details>
---

## 7. Usando $arrayElementAt
### a. Obter a referência de série numa notícia como objeto ao invés de lista, retornando apenas nome, rating e generos 
<details><summary>Resposta</summary>

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
</details>