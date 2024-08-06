pipeline {
    agent any

    environment {
        NODE_VERSION = '20'
        DEPLOY_DIR = '/home/ubuntu/nest'
        NPM_CACHE = '/var/lib/jenkins/.npm'

        DB_HOST = 'localhost' 
        DB_PORT = '5432'
        DB_USER = 'postgres'
        DB_PASSWORD = '1234'
        DB_NAME = 'capstone'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Clone Repo'){
            steps {
                sh '''
                    sudo git clone https://github.com/YonasTewabe/Job-Portal-API-NestJs.git
                     cd Job-Portal-API-NestJs
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        stage('Run') {
            steps {
                sh 'npm run start:prod'
            }
        }

        // stage('Deploy') {
        //     steps {
        //         script {
        //             sh "mkdir -p ${DEPLOY_DIR}"

        //         }
        //     }
        // }
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
