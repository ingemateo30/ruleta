create table bodegas
(
    CODIGO int                     not null
        primary key,
    BODEGA varchar(100) default '' not null
)
    engine = MyISAM;

create table hislottojuego
(
    RADICADO  varchar(20)  default '' not null,
    CODANIMAL varchar(20)  default '' not null,
    ANIMAL    varchar(100) default '' not null,
    VALOR     float(9, 3)             not null,
    CODIGOJ   int                     not null,
    HORAJUEGO time                    not null,
    DESJUEGO  varchar(500) default '' not null,
    SUCURSAL  varchar(500) default '' not null,
    FECHA     date                    not null,
    HORA      time                    not null,
    ESTADOP   varchar(2)   default '' not null,
    ESTADOC   varchar(2)   default '' not null
)
    engine = MyISAM;

create table horariojuego
(
    NUM         int                     not null
        primary key,
    DESCRIPCION varchar(500) default '' not null,
    HORA        time                    not null,
    ESTADO      varchar(2)   default '' not null
)
    engine = MyISAM;

create table ingresarganadores
(
    CODIGOA      varchar(5)   default '' not null,
    ANIMAL       varchar(50)  default '' not null,
    CODIGOH      int                     not null,
    DESCRIOCIONH varchar(500) default '' not null,
    FECHA        date                    not null,
    ESTADO       varchar(2)   default '' not null
)
    engine = MyISAM;

create table jugarlotto
(
    NUM        int                     not null
        primary key,
    RADICADO   varchar(20)  default '' not null,
    FECHA      date                    not null,
    HORA       time                    not null,
    SUCURSAL   varchar(500) default '' not null,
    TOTALJUEGO float(9, 3)             not null,
    USUARIO    varchar(100) default '' not null,
    ESTADO     varchar(2)   default '' not null
)
    engine = MyISAM;

create table lottoruleta
(
    NUM         int                    not null
        primary key,
    CODIGOJUEGO varchar(3)  default '' not null,
    VALOR       varchar(50) default '' not null,
    COLOR       varchar(2)  default '' not null,
    ESTADO      varchar(2)  default '' not null
)
    engine = MyISAM;

create table parametros
(
    CODIGO int                     not null
        primary key,
    NOMBRE varchar(100) default '' not null,
    VALOR  varchar(50)  default '' not null
)
    engine = MyISAM;

create table seguridad
(
    ID        varchar(20)  default '' not null
        primary key,
    NOMBRE    varchar(100) default '' not null,
    NICK      varchar(20)  default '' not null,
    CLAVE     varchar(20)  default '' not null,
    TIPO      varchar(2)   default '' not null,
    CAJA      int                     not null,
    CODBODEGA int                     not null,
    ESTADO    varchar(2)   default '' not null
)
    engine = MyISAM;


