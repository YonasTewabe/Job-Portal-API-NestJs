pipeline {
    agent any

    environment {
        NODE_VERSION = '20' 
        DEPLOY_DIR = '/var/www/html/job-portal/'
        NPM_CACHE = '/var/lib/jenkins/.npm'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // stage('Setup Node.js') {
        //     steps {
        //         script {
        //             def nodeHome = tool name: 'nodejs', type: 'NodeJSInstallation'
        //             env.PATH = "${nodeHome}/bin:${env.PATH}"
        //         }
        //     }
        // }

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

        stage('Deploy') {
            steps {
                script {
                    // Ensure the deployment directory exists
                    sh "sudo mkdir -p ${DEPLOY_DIR}"

                    // Copy the built files to the deployment directory
                    sh "sudo cp -r dist/* ${DEPLOY_DIR}"

                    // Restart the application (if applicable)
                    // Example: Restarting a systemd service
                    // sh 'sudo systemctl restart your-nestjs-service'
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
