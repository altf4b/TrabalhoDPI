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

// ==========================================
// ROTAS GET (VISUALIZAÇÃO)
// ==========================================

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

// GET - emprestimos
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

// GET - listar todas as tags globais 
api.get("/tags", async (req, res) => {
    try {
        const tags = await conn("tags").select("*");
        res.status(200).json(tags);
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao buscar as tags." });
    }
});


// ==========================================
// ROTAS POST (CRIAÇÃO / CADASTRO)
// ==========================================

// POST - coisas 
api.post("/coisas", async (req, res) => {
    try {

        const { nome, tipo, estado_conservacao, tags } = req.body;

        if (!nome || !tipo) {
            return res.status(400).json({
                erro: "Nome e tipo são obrigatórios."
            });
        }

        await conn.transaction(async (trx) => {
            

            const [coisa_id] = await trx("coisas").insert({ 
                nome, 
                tipo,
                estado_conservacao: estado_conservacao || "Bom"
            });


            if (tipo === "jogo") {
                await trx("jogos").insert({ coisa_id });
            } else if (tipo === "livro") {
                await trx("livros").insert({ coisa_id });
            } else if (tipo === "objeto") {
                await trx("objetos").insert({ coisa_id });
            } else {
                throw new Error("Tipo de item inválido fornecido.");
            }


            if (tags && Array.isArray(tags) && tags.length > 0) {
                const vinculoTags = tags.map(tag_id => ({
                    coisa_id,
                    tag_id
                }));
                await trx("coisa_tags").insert(vinculoTags);
            }
        });

        res.status(201).json({
            mensagem: "Item, subcategoria e tags cadastrados com sucesso!"
        });

    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao cadastrar o item." });
    }
});

// POST - realizar novo empréstimo 
api.post("/emprestimos", async (req, res) => {
    try {
        const { coisa_id, nome_pessoa, data_emprestimo } = req.body;

        if (!coisa_id || !nome_pessoa || !data_emprestimo) {
            return res.status(400).json({
                erro: "Item (coisa_id), nome da pessoa e data de empréstimo são obrigatórios."
            });
        }

        await conn("emprestimos").insert({
            coisa_id,
            nome_pessoa,
            data_emprestimo,
            status: "emprestado"
        });

        res.status(201).json({
            mensagem: "Empréstimo registrado com sucesso!"
        });
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao registrar o empréstimo." });
    }
});

// POST - cadastrar uma nova tag global 
api.post("/tags", async (req, res) => {
    try {
        const { nome } = req.body;

        if (!nome) {
            return res.status(400).json({
                erro: "O nome da tag é obrigatório."
            });
        }

        await conn("tags").insert({ nome });

        res.status(201).json({
            mensagem: "Tag global criada com sucesso!"
        });
    } catch (erro) {
        console.log(erro);
        res.status(500).json({ erro: "Erro ao criar a tag." });
    }
});


// ==========================================
// ROTAS PUT (ATUALIZAÇÃO)
// ==========================================

// PUT - atualizar coisa 
api.put("/coisas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, tipo, estado_conservacao } = req.body;

        await conn("coisas")
            .where({ id })
            .update({ nome, tipo, estado_conservacao });

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
                data_devolucao: new Date() 
            });
            
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


// ==========================================
// ROTAS DELETE (EXCLUSÃO)
// ==========================================

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

// DELETE - empréstimos
api.delete("/emprestimos/:id", async (req, res) => {
    try {
        const { id } = req.params;
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
});


api.listen(PORT, HOSTNAME, () => {
    console.log(`Servidor rodando em http://${HOSTNAME}:${PORT}`);
});
