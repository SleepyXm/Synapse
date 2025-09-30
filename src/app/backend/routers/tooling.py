from langchain.vectorstores import Chroma
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA

# 1️⃣ Setup embeddings and vector DB
embeddings = OpenAIEmbeddings()

# Load or create vector DB
# Suppose 'docs' is a list of documents we want to index
from langchain.text_splitter import RecursiveCharacterTextSplitter
text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

docs = [
    "How to reset your password: Go to Settings → Security → Reset Password...",
    "How to update your email: Go to Settings → Account → Update Email...",
    "How to delete your account: Contact support and request account deletion..."
]

# Split docs into chunks
chunks = []
for doc in docs:
    chunks.extend(text_splitter.split_text(doc))

# Create a vector DB
vector_db = Chroma.from_texts(chunks, embedding=embeddings)


retriever = vector_db.as_retriever(search_kwargs={"k": 3})
llm = ChatOpenAI(model_name="gpt-4", temperature=0)
