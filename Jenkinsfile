pipeline {
    agent any

    options {
        timestamps()
    }

    stages {
        stage('Verification du projet') {
            steps {
                sh 'pwd'
                sh 'git log -1 --oneline'
                sh 'test -f dcp-backend/Dockerfile'
                sh 'test -f dcp-frontend/Dockerfile'
            }
        }

        stage('Construction du backend') {
            steps {
                sh 'docker build -t dcp-backend:ci-${BUILD_NUMBER} dcp-backend'
            }
        }

        stage('Construction du frontend') {
            steps {
                sh 'docker build -t dcp-frontend:ci-${BUILD_NUMBER} dcp-frontend'
            }
        }

        stage('Verification des images') {
            steps {
                sh 'docker images dcp-backend:ci-${BUILD_NUMBER}'
                sh 'docker images dcp-frontend:ci-${BUILD_NUMBER}'
            }
        }
    }

    post {
        success {
            echo 'Les deux images DCP ont été construites avec succès.'
        }

        failure {
            echo 'Le pipeline a rencontré une erreur.'
        }
    }
}
