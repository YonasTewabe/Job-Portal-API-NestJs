pipeline {
    agent any

    environment {
        NODE_VERSION = '20'
        DEPLOY_DIR = '/home/ubuntu/nest'
        NPM_CACHE = '/var/lib/jenkins/.npm'

        DB_HOST = 'localhost' 
        DB_PORT = '5432'
        DB_USER = 'yonas'
        DB_PASSWORD = '987654312'
        DB_NAME = 'capstone'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run') {
            steps {
                sh 'npm start'
            }
        }

        stage('Deploy') {
            steps {
                script {
                    sh "mkdir -p ${DEPLOY_DIR}"

                }
            }
        }
    }

    post {
        success {
            echo "Pipeline successful"
        }
        failure {
            echo "Pipeline failed"
        }
        always {
            cleanWs()
        }
    }
}
