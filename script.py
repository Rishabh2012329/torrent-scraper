import requests
from bs4 import BeautifulSoup

for i in range(1, 101):
    print(i)
    url = f"https://www.linkedin.com/search/results/people/?keywords=shipra%20yadav&origin=GLOBAL_SEARCH_HEADER&page={i}"
    page = requests.get(url)
    soup = BeautifulSoup(page.content, 'html.parser')
    results = soup.find_all(class_='entity-result__item')
    for result in results:
        print(result.prettify())