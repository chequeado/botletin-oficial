import json
import time

import openai

from utils.publication_pipeline import generate_publication
from utils.scraper import today_urls
from utils.loader import json_loader


def main():
    urls = today_urls()
    print(f"{len(urls)} Publications found.")
    print('***************')

    for i, url in enumerate(urls):
        print(f"Publication {i+1}")

        try:
            publication = generate_publication(url)

        except openai.error.APIError as error:
            print(error, 'Waiting 20s to retry...')
            publication = generate_publication(url)

        json_loader(publication)
        print('***************')

if __name__ == "__main__":
    main()