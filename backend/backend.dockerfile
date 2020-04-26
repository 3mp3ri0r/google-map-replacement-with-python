FROM python:3

# Copy requirements
COPY requirements.txt .

# Install application dependency
RUN pip install -r requirements.txt

# Copy the application
COPY . .

# Expose and run the application
EXPOSE 8080
CMD ["python", "src/main.py"]
