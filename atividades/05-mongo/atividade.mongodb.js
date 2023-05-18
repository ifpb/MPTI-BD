// 1. Exibir titulo, link, data das notícias e nome do produtor que estão relacionadas à série que contém como produtor Vince Gilligan
use("MPTIBD");
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
        $match: {
            "serie.produtores": { $in: ["Vince Gilligan"] }
        }
    },
    {
        $project: {
          _id: 0,
          titulo: 1,
          link: 1,
          data: 1,
          produtor: { $arrayElemAt: ["$serie.produtores", 0] }
        }
    }
]);



// 2. Exibir nome, sinopse e rating da série de menor avaliação (rating)
use("MPTIBD");
db.series.aggregate([
    {
        $project: {
            _id: 0,
            nome: 1,
            sinopse: 1,
            rating: 1
        }
    },
    {
        $sort: {
            rating: 1
        }
    },
    {
        $limit: 1
    }
]);

// 3. Exibir média de notas de críticas dos usuários para cada série, exibindo além da média, o nome de cada série. 
// Ordene o resultado em ordem decrescente.
use("MPTIBD");
db.series.aggregate([
    {
        $project: {
            _id: 0,
            nome: 1,
            criticas: 1
        }
    },
    {
        $unwind: "$criticas"
    },
    {
        $group: {
            _id: {
                nome: "$nome"
            },
            media: { $avg: "$criticas.nota" }
        }
    },
    {
        $sort: {
            media: -1
        }
    }
]);


// 4. Exiba o nome das séries que possuem como ator "Justin Hartley"
use("MPTIBD");
db.series.aggregate([
    {
        $unwind: "$atores"
    },
    {
        $match: {
            "atores.nome": "Justin Hartley"
        }
    },
    {
        $group: {
            _id: "$atores.nome",
            series: { 
                $push: { 
                    serie: "$nome",
                    personagem: "$atores.personagem"
                } 
            }
        }
    }
]);



// 5. Exiba a lista de todos os usuários que comentaram em todas as séries e mostre a quantidade de comentários que cada um fez (caso o mesmo tenha feito mais de um comentário) em ordem decrescente.
use("MPTIBD");
db.series.aggregate([
    {
        $unwind: "$criticas"
    },
    {
        $group: {
            _id: "$criticas.usuario",
            total: { $sum: 1 },
        }
    },
    {
        $match: {
            total: { $gte: 1 }
        }
    },
    {
        $sort: {
            total: -1,
            _id: 1
        }
    },
    {
        $project: {
            _id: 0,
            nomeUsuario: "$_id",
            qtdCriticas: "$total",
        }
    }
]);
