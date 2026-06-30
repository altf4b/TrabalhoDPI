const express = require("express")
const knex = require("knex")
const http_errors = require("http-errors")

const PORT = 8001
const HOSTNAME = "localhost"

const api = express()
api.use( express.json() )
api.use( express.urlencoded( { extended : true } ) )

const conn = knex({
    client: "mysql",
    connection: {
        host: HOSTNAME,
        user: "root",
        password: "",
        database: "material"
    }
});

// GET - visualizar coisas
api.get("/coisas", async (req, res) => {
    try {
        const coisas = await conn("coisas");
        res.status(200).json(coisas);
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao buscar as coisas." });
    }
});

// GET - jogos
api.get("/jogos", async (req, res) => {
    try {
        const jogos = await conn("coisas").where("tipo", "jogo");
        res.status(200).json(jogos);
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao buscar os jogos." });
    }
});

// GET - objetos
api.get("/objetos", async (req, res) => {
    try {
        const objetos = await conn("coisas").where("tipo", "objeto");
        res.status(200).json(objetos);
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao buscar os objetos." });
    }
});

// GET - livros
api.get("/livros", async (req, res) => {
    try {
        const livros = await conn("coisas").where("tipo", "livro");
        res.status(200).json(livros);
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao buscar os livros." });
    }
});


// GET - emprestimos (COM JOIN)
api.get("/emprestimos", async (req, res) => {
    try {
        const emprestimos = await conn("emprestimos")
            .join("coisas", "emprestimos.coisa_id", "coisas.id")
            .select(
                "emprestimos.id",
                "coisas.nome",
                "emprestimos.nome_pessoa",
                "emprestimos.data_emprestimo",
                "emprestimos.data_devolucao",
                "emprestimos.status"
            );

        res.status(200).json(emprestimos);
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao buscar empréstimos." });
    }
});


// POST - coisas
api.post("/coisas", async (req, res) => {
    try {
        const { nome, tipo } = req.body;

        if (!nome || !tipo) {
            return res.status(400).json({
                erro: "Nome e tipo são obrigatórios."
            });
        }

        await conn.transaction(async (trx) => {
            
            // Insere na tabela principal 'coisas' e recupera o ID gerado
            const [coisa_id] = await trx("coisas").insert({ nome, tipo });

            // 2. Insere na tabela filha correspondente usando o ID recuperado
            if (tipo === "jogo") {
                await trx("jogos").insert({ coisa_id });
            } else if (tipo === "livro") {
                await trx("livros").insert({ coisa_id });
            } else if (tipo === "objeto") {
                await trx("objetos").insert({ coisa_id });
            } else {
                throw new Error("Tipo de item inválido fornecido.");
            }
        });

        res.status(201).json({
            mensagem: "Item e subcategoria cadastrados com sucesso!"
        });

    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao cadastrar o item." });
    }
});

// PUT - atualizar coisa
api.put("/coisas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, tipo } = req.body;

        await conn("coisas")
            .where({ id })
            .update({ nome, tipo });

        res.status(200).json({
            mensagem: "Item atualizado com sucesso!"
        });

    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao atualizar o item." });
    }
});

// PUT - devolver empréstimo
api.put("/emprestimos/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const atualizado = await conn("emprestimos")
            .where({ id })
            .update({
                status: "devolvido",
                data_devolucao: new Date() });
        if (!atualizado) {
            return res.status(404).json({
                erro: "Empréstimo não encontrado"
            });
        }
        res.status(200).json({
            mensagem: "Item devolvido com sucesso!"
        });

    } catch (erro) {
        console.log(erro);
        res.status(500).json({
            erro: "Erro ao devolver o item."
        });
    }
});


// DELETE - coisas
api.delete("/coisas/:id", (req, res, next) => {
    const id = req.params.id;
    conn("coisas")
        .where("id", id)
        .del()
        .then((dados) => {
            if (!dados) {
                return res.status(404).json({
                    erro: "Item não encontrado"
                });
            }
            res.status(200).json({
                mensagem: "Item excluído com sucesso!"
            });
        })
        .catch(next);
});

api.delete("/emprestimos/:id", async (req, res) => {
    try {const { id } = req.params;
        const deletado = await conn("emprestimos")
            .where({ id })
            .del();

        if (!deletado) {
            return res.status(404).json({
                erro: "Empréstimo não encontrado"
            });
        }
        res.status(200).json({
            mensagem: "Empréstimo removido com sucesso!"
        });

    } catch (erro) {
        console.log(erro);
        res.status(500).json({
            erro: "Erro ao deletar empréstimo."
        });

    }

})

api.listen(PORT, HOSTNAME, () => {
    console.log(`Servidor rodando em http://${HOSTNAME}:${PORT}`);
});
