pipeline {
    agent any

    options {
        timestamps()
    }

    environment {
        BACKEND_IMAGE = 'sylvano123/dcp-backend'
        FRONTEND_IMAGE = 'sylvano123/dcp-frontend'

        POSTGRES_DB = 'dcp_materiel'
        POSTGRES_USER = 'dcp_user'
        JWT_EXPIRES_IN = '8h'
        CLIENT_ORIGIN = 'http://127.0.0.1:8083'
    }

    stages {
        stage('Verification du projet') {
            steps {
                sh 'pwd'
                sh 'git log -1 --oneline'
                sh 'test -f dcp-backend/Dockerfile'
                sh 'test -f dcp-backend/test/health.test.js'
                sh 'test -f dcp-frontend/Dockerfile'
                sh 'test -f compose.prod.yaml'
            }
        }

        stage('Tests du backend') {
            steps {
                sh '''
                    docker run --rm \
                        -v "$WORKSPACE/dcp-backend:/app" \
                        -v /app/node_modules \
                        -w /app \
                        node:24-alpine \
                        sh -c "npm ci && npm test"
                '''
            }
        }
        stage('Validation du frontend') {
            steps {
                sh 'docker run --rm -v "$WORKSPACE/dcp-frontend:/source:ro" -w /app node:24-alpine sh -c "cp -a /source/. /app/ && npm ci && npm run build"'
            }
        }

        stage('Construction du backend') {
            steps {
                sh '''
                    docker build \
                        -t "$BACKEND_IMAGE:ci-$BUILD_NUMBER" \
                        dcp-backend
                '''
            }
        }

        stage('Construction du frontend') {
            steps {
                sh '''
                    docker build \
                        -t "$FRONTEND_IMAGE:ci-$BUILD_NUMBER" \
                        dcp-frontend
                '''
            }
        }

        stage('Verification des images') {
            steps {
                sh '''
                    docker image inspect \
                        "$BACKEND_IMAGE:ci-$BUILD_NUMBER"
                '''

                sh '''
                    docker image inspect \
                        "$FRONTEND_IMAGE:ci-$BUILD_NUMBER"
                '''
            }
        }

        stage('Publication Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-dcp',
                        usernameVariable: 'DOCKERHUB_USER',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    sh '''
                        printf "%s" "$DOCKERHUB_TOKEN" |
                            docker login \
                                --username "$DOCKERHUB_USER" \
                                --password-stdin
                    '''

                    sh '''
                        docker push \
                            "$BACKEND_IMAGE:ci-$BUILD_NUMBER"
                    '''

                    sh '''
                        docker push \
                            "$FRONTEND_IMAGE:ci-$BUILD_NUMBER"
                    '''
                }
            }
        }

        stage('Deploiement') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'dcp-postgres-password',
                        variable: 'POSTGRES_PASSWORD'
                    ),
                    string(
                        credentialsId: 'dcp-jwt-secret',
                        variable: 'JWT_SECRET'
                    )
                ]) {
                    sh '''
                        export IMAGE_TAG="ci-${BUILD_NUMBER}"

                        docker compose \
                            -p dcp \
                            -f compose.prod.yaml \
                            pull

                        docker compose \
                            -p dcp \
                            -f compose.prod.yaml \
                            up -d --remove-orphans

                        docker compose \
                            -p dcp \
                            -f compose.prod.yaml \
                            ps
                    '''
                }
            }
        }

        stage('Verification du deploiement') {
            steps {
                sh '''
                    for tentative in 1 2 3 4 5 6
                    do
                        if curl \
                            --fail \
                            --silent \
                            http://localhost:8080/api/health
                        then
                            echo
                            echo "API DCP operationnelle."
                            exit 0
                        fi

                        echo "API indisponible, nouvelle tentative dans 5 secondes..."
                        sleep 5
                    done

                    echo "Echec de la verification de l API."
                    exit 1
                '''
            }
        }
    }

    post {
        always {
            sh '''
                docker logout >/dev/null 2>&1 || true
            '''
        }

        success {
            echo 'Tests, construction, publication et déploiement réussis.'
        }

        failure {
            echo 'Le pipeline CI/CD a rencontré une erreur.'
        }
    }
}
