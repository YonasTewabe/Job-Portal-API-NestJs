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

        stage('Clone Repo') {
            steps {
                script {
                    // Clean up the directory if it exists to avoid issues with git clone
                    sh '''
                        if [ -d "/home/ubuntu/Job-Portal-API-NestJs" ]; then
                            rm -rf /home/ubuntu/Job-Portal-API-NestJs
                        fi
                    '''
                    // Clone the repository
                    sh 'git clone https://github.com/YonasTewabe/Job-Portal-API-NestJs.git /home/ubuntu/Job-Portal-API-NestJs'
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('/home/ubuntu/Job-Portal-API-NestJs') {
                    sh 'npm install'
                }
            }
        }

        stage('Build') {
            steps {
                dir('/home/ubuntu/Job-Portal-API-NestJs') {
                    sh 'npm run build'
                }
            }
        }

        stage('Run') {
            steps {
                dir('/home/ubuntu/Job-Portal-API-NestJs') {
                    sh 'npm run start:prod'
                }
            }
        }

        // Uncomment and customize the deploy stage if needed
        // stage('Deploy') {
        //     steps {
        //         script {
        //             sh "mkdir -p ${DEPLOY_DIR}"
        //             // Add deployment commands here
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
