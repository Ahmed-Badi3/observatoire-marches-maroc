"""Connexion unique à PostgreSQL pour tous les scripts.

Image : un porte-clés. Si la variable d'environnement DATABASE_URL existe (Supabase, GitHub
Actions), on prend cette clé. Sinon on prend la clé locale de `config.py`.

Usage dans un script :
    from connexion import PG, url_sqlalchemy
    psycopg2.connect(**PG)                    # scripts 06, 08, 09 (psycopg2)
    engine = create_engine(url_sqlalchemy())  # scripts 04, 05 (SQLAlchemy + psycopg)

Aucun mot de passe n'est écrit ici : il vient de DATABASE_URL ou de config.py (ignoré par Git).
"""
import os
from urllib.parse import parse_qsl, unquote, urlparse


def _depuis_url(url):
    """Découpe postgresql://utilisateur:mot_de_passe@hote:port/base?sslmode=require en dictionnaire."""
    morceaux = urlparse(url)
    if morceaux.scheme not in ("postgres", "postgresql"):
        raise ValueError("DATABASE_URL doit commencer par postgresql:// (ou postgres://)")
    parametres = {
        "host": morceaux.hostname,
        "port": morceaux.port or 5432,
        "dbname": unquote(morceaux.path.lstrip("/")),
        "user": unquote(morceaux.username or ""),
        "password": unquote(morceaux.password or ""),
    }
    parametres.update(dict(parse_qsl(morceaux.query)))  # ex. sslmode=require
    return parametres


def _lire_parametres():
    url = os.environ.get("DATABASE_URL")
    if url:
        return _depuis_url(url)
    try:
        from config import PG as pg_local
    except ImportError:
        raise SystemExit(
            "Aucune connexion : définissez DATABASE_URL, ou créez scripts/config.py "
            "à partir de config.example.py."
        )
    return dict(pg_local)


# Dictionnaire prêt pour psycopg2.connect(**PG). Les clés en plus (sslmode) sont acceptées.
PG = _lire_parametres()


def url_sqlalchemy():
    """URL SQLAlchemy (pilote psycopg). `URL.create` gère les caractères spéciaux du mot de passe."""
    from sqlalchemy import URL  # importé ici : les scripts psycopg2 n'ont pas besoin de SQLAlchemy

    extras = {k: v for k, v in PG.items() if k not in ("host", "port", "dbname", "user", "password")}
    return URL.create(
        "postgresql+psycopg",
        username=PG["user"],
        password=PG["password"],
        host=PG["host"],
        port=PG["port"],
        database=PG["dbname"],
        query=extras,
    )
