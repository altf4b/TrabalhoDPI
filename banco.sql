CREATE DATABASE material;

USE material;

CREATE TABLE coisas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('jogo','livro','objeto') NOT NULL
);

CREATE TABLE jogos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coisa_id INT NOT NULL,
    FOREIGN KEY (coisa_id) REFERENCES coisas(id)
);

CREATE TABLE livros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coisa_id INT NOT NULL,
    FOREIGN KEY (coisa_id) REFERENCES coisas(id)
);

CREATE TABLE objetos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coisa_id INT NOT NULL,
    FOREIGN KEY (coisa_id) REFERENCES coisas(id)
);

CREATE TABLE emprestimos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coisa_id INT NOT NULL,
    nome_pessoa VARCHAR(100) NOT NULL,
    data_emprestimo DATE NOT NULL,
    data_devolucao DATE,
    status ENUM('emprestado','devolvido') DEFAULT 'emprestado',
    FOREIGN KEY (coisa_id) REFERENCES coisas(id)
);

INSERT INTO coisas (nome, tipo)
VALUES
('Minecraft', 'jogo'),
('FIFA 25', 'jogo'),
('Dom Casmurro', 'livro'),
('Harry Potter', 'livro'),
('Martelo', 'objeto'),
('Chave de Fenda', 'objeto');

INSERT INTO emprestimos (
    coisa_id,
    nome_pessoa,
    data_emprestimo,
    status
)
VALUES
(3, 'João', '2026-06-27', 'emprestado'),
(5, 'Maria', '2026-06-25', 'devolvido');

INSERT INTO jogos (coisa_id)
VALUES
(1),
(2);

INSERT INTO livros (coisa_id)
VALUES
(3),
(4);

INSERT INTO objetos (coisa_id)
VALUES
(5),
(6);