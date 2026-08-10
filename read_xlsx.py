import pandas as pd
df = pd.read_excel('College_data.csv')
print(df.head(20).to_string())
